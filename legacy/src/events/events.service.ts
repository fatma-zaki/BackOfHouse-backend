import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompaniesService } from '../companies/companies.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventEntity, EventRegistrationEntity, EventStatus } from './event.types';
import { AuthContext } from '../auth/types/auth-context';
import { Permission, hasPermission } from '../auth/decorators/permissions.enum';
import { RpcFunctions, Tables } from '../common/constants';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'organizer',
  'location',
  'start_date',
  'end_date',
  'cover_image_url',
  'capacity',
  'status',
] as const;

const SEARCHABLE_COLUMNS = ['title', 'organizer', 'location'] as const;
const SORTABLE_COLUMNS = ['start_date', 'created_at', 'title'] as const;
const VISIBLE_STATUSES = [EventStatus.Published, EventStatus.Cancelled, EventStatus.Completed];
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(context: AuthContext, dto: CreateEventDto): Promise<EventEntity> {
    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('end_date must not precede start_date');
    }

    // Hosting an event on behalf of a company requires membership of it.
    if (dto.company_id) {
      await this.companiesService.assertCompanyMember(dto.company_id, context);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.EVENTS)
      .insert({
        title: dto.title,
        slug: dto.slug,
        description: dto.description ?? null,
        organizer: dto.organizer,
        location: dto.location ?? null,
        start_date: dto.start_date,
        end_date: dto.end_date,
        status: EventStatus.Draft,
        cover_image_url: dto.cover_image_url ?? null,
        capacity: dto.capacity ?? null,
        created_by: context.profileId,
        company_id: dto.company_id ?? null,
      })
      .select('*')
      .single<EventEntity>();

    if (error || !data) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('An event with this slug already exists');
      }
      this.logger.error(`Failed to create event: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the event');
    }

    return data;
  }

  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<EventEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'start_date',
      ascending: true,
    });

    let request = this.databaseService.admin
      .from(Tables.EVENTS)
      .select('*', { count: 'exact' })
      .in('status', VISIBLE_STATUSES);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list events: ${error.message}`);
      throw new InternalOperationException('Unable to list events');
    }

    return { data: (data ?? []) as EventEntity[], total: count ?? 0 };
  }

  /** Drafts are visible only to people who may manage the event. */
  async findById(id: UUID, context: AuthContext): Promise<EventEntity> {
    const event = await this.loadById(id);

    if (!VISIBLE_STATUSES.includes(event.status) && !(await this.canManage(event, context))) {
      throw new NotFoundException('Event', id);
    }

    return event;
  }

  async update(id: UUID, dto: UpdateEventDto, context: AuthContext): Promise<EventEntity> {
    const event = await this.loadById(id);
    await this.assertCanManage(event, context);

    const start = dto.start_date ?? event.start_date;
    const end = dto.end_date ?? event.end_date;
    if (new Date(end) < new Date(start)) {
      throw new BadRequestException('end_date must not precede start_date');
    }

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return event;
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.EVENTS)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<EventEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update event ${id}: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the event');
    }

    return data;
  }

  async remove(id: UUID, context: AuthContext): Promise<void> {
    const event = await this.loadById(id);
    await this.assertCanManage(event, context);

    const { error } = await this.databaseService.admin.from(Tables.EVENTS).delete().eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete event ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the event');
    }
  }

  /**
   * Registers the caller.
   *
   * Capacity is enforced inside a transaction that locks the event row, so a
   * burst of simultaneous registrations cannot oversubscribe the event.
   */
  async register(eventId: UUID, context: AuthContext): Promise<EventRegistrationEntity> {
    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.REGISTER_FOR_EVENT, {
        p_user_id: context.profileId,
        p_event_id: eventId,
      })
      .single<EventRegistrationEntity>();

    if (error) {
      if (error.message.includes('event_not_found')) {
        throw new NotFoundException('Event', eventId);
      }
      if (error.message.includes('event_not_open')) {
        throw new BadRequestException('This event is not open for registration');
      }
      if (error.message.includes('event_full')) {
        throw new ConflictException('This event has reached its capacity');
      }
      if (error.message.includes('already_registered')) {
        throw new ConflictException('You are already registered for this event');
      }
      this.logger.error(`Failed to register for event ${eventId}: ${error.message}`);
      throw new InternalOperationException('Unable to register for the event');
    }

    return data;
  }

  async unregister(eventId: UUID, context: AuthContext): Promise<void> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.EVENT_REGISTRATIONS)
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', context.profileId)
      .select('id');

    if (error) {
      this.logger.error(`Failed to unregister from event ${eventId}: ${error.message}`);
      throw new InternalOperationException('Unable to cancel the registration');
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Event registration');
    }
  }

  /** The attendee list is organiser-only; members see just their own registration. */
  async listRegistrations(
    eventId: UUID,
    context: AuthContext,
    pagination: PaginationParams,
  ): Promise<ListResult<EventRegistrationEntity>> {
    const event = await this.loadById(eventId);
    await this.assertCanManage(event, context);

    const { data, error, count } = await this.databaseService.admin
      .from(Tables.EVENT_REGISTRATIONS)
      .select('*', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list registrations: ${error.message}`);
      throw new InternalOperationException('Unable to list registrations');
    }

    return { data: (data ?? []) as EventRegistrationEntity[], total: count ?? 0 };
  }

  async getOwnRegistration(
    eventId: UUID,
    context: AuthContext,
  ): Promise<EventRegistrationEntity | null> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.EVENT_REGISTRATIONS)
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', context.profileId)
      .maybeSingle<EventRegistrationEntity>();

    if (error) {
      throw new InternalOperationException('Unable to load the registration');
    }

    return data;
  }

  private async loadById(id: UUID): Promise<EventEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.EVENTS)
      .select('*')
      .eq('id', id)
      .maybeSingle<EventEntity>();

    if (error) {
      this.logger.error(`Failed to load event ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the event');
    }

    if (!data) {
      throw new NotFoundException('Event', id);
    }

    return data;
  }

  /** Managers are the creator, an admin of the hosting company, or a platform admin. */
  private async canManage(event: EventEntity, context: AuthContext): Promise<boolean> {
    if (hasPermission(context.role, Permission.EVENT_MANAGE_ANY) || event.created_by === context.profileId) {
      return true;
    }

    if (event.company_id) {
      return this.companiesService.isCompanyAdmin(event.company_id, context);
    }

    return false;
  }

  private async assertCanManage(event: EventEntity, context: AuthContext): Promise<void> {
    if (!(await this.canManage(event, context))) {
      throw new ForbiddenException('You cannot manage this event');
    }
  }
}
