import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
import { ProfessionalEntity, ProfileVisibility } from './professional.types';
import { AuthContext } from '../auth/types/auth-context';
import { Permission, hasPermission } from '../auth/decorators/permissions.enum';
import { Tables } from '../common/constants';
import {
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
  'profession',
  'specialties',
  'skills',
  'experience',
  'location',
  'availability',
  'portfolio_links',
  'profile_visibility',
] as const;

const SEARCHABLE_COLUMNS = ['profession', 'location'] as const;
const SORTABLE_COLUMNS = ['created_at', 'experience', 'profession'] as const;
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** The profile is always attached to the caller's own account. */
  async createOwn(context: AuthContext, dto: CreateProfessionalDto): Promise<ProfessionalEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .insert({
        user_id: context.profileId,
        profession: dto.profession,
        specialties: dto.specialties ?? [],
        skills: dto.skills ?? [],
        experience: dto.experience ?? 0,
        location: dto.location ?? null,
        availability: dto.availability ?? undefined,
        portfolio_links: dto.portfolio_links ?? [],
        profile_visibility: dto.profile_visibility ?? ProfileVisibility.Public,
      })
      .select('*')
      .single<ProfessionalEntity>();

    if (error || !data) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('A professional profile already exists for this account');
      }
      this.logger.error(`Failed to create professional: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the professional profile');
    }

    return data;
  }

  /** Only public profiles are discoverable through the directory. */
  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<ProfessionalEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'created_at',
      ascending: false,
    });

    let request = this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .select('*', { count: 'exact' })
      .eq('profile_visibility', ProfileVisibility.Public);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list professionals: ${error.message}`);
      throw new InternalOperationException('Unable to list professionals');
    }

    return { data: (data ?? []) as ProfessionalEntity[], total: count ?? 0 };
  }

  async findById(id: UUID, context: AuthContext): Promise<ProfessionalEntity> {
    const profile = await this.loadById(id);
    this.assertVisible(profile, context);
    return profile;
  }

  async findByUserId(userId: UUID, context: AuthContext): Promise<ProfessionalEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<ProfessionalEntity>();

    if (error) {
      this.logger.error(`Failed to load professional for user ${userId}: ${error.message}`);
      throw new InternalOperationException('Unable to load the professional profile');
    }

    if (!data) {
      throw new NotFoundException('Professional profile for user', userId);
    }

    this.assertVisible(data, context);
    return data;
  }

  async getOwn(context: AuthContext): Promise<ProfessionalEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .select('*')
      .eq('user_id', context.profileId)
      .maybeSingle<ProfessionalEntity>();

    if (error) {
      throw new InternalOperationException('Unable to load the professional profile');
    }

    if (!data) {
      throw new NotFoundException('Professional profile');
    }

    return data;
  }

  async updateOwn(
    id: UUID,
    dto: UpdateProfessionalDto,
    context: AuthContext,
  ): Promise<ProfessionalEntity> {
    const existing = await this.loadById(id);

    if (existing.user_id !== context.profileId) {
      throw new ForbiddenException('You can only edit your own professional profile');
    }

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return existing;
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<ProfessionalEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update professional ${id}: ${error?.message ?? 'no row'}`);
      throw new InternalOperationException('Unable to update the professional profile');
    }

    return data;
  }

  async removeOwn(id: UUID, context: AuthContext): Promise<void> {
    const existing = await this.loadById(id);

    if (existing.user_id !== context.profileId) {
      throw new ForbiddenException('You can only delete your own professional profile');
    }

    const { error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete professional ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the professional profile');
    }
  }

  private async loadById(id: UUID): Promise<ProfessionalEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.PROFESSIONALS)
      .select('*')
      .eq('id', id)
      .maybeSingle<ProfessionalEntity>();

    if (error) {
      this.logger.error(`Failed to load professional ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the professional profile');
    }

    if (!data) {
      throw new NotFoundException('Professional', id);
    }

    return data;
  }

  /**
   * A non-public profile is readable only by its owner (and platform admins).
   * Returning 404 rather than 403 avoids confirming that the record exists.
   */
  private assertVisible(profile: ProfessionalEntity, context: AuthContext): void {
    const isOwner = profile.user_id === context.profileId;
    const canReadPrivate = hasPermission(context.role, Permission.PROFILE_READ_PRIVATE);

    if (profile.profile_visibility !== ProfileVisibility.Public && !isOwner && !canReadPrivate) {
      throw new NotFoundException('Professional', profile.id);
    }
  }
}
