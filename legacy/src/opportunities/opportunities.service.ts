import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompaniesService } from '../companies/companies.service';
import { CreateOpportunityDto, ListOpportunitiesQueryDto, UpdateOpportunityDto } from './dto/opportunity.dto';
import { OpportunityEntity, OpportunityStatus } from './opportunity.types';
import { AuthContext } from '../auth/types/auth-context';
import { Permission, hasPermission } from '../auth/decorators/permissions.enum';
import { Tables } from '../common/constants';
import {
  ForbiddenException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = ['title', 'description', 'location', 'deadline', 'status'] as const;
const SEARCHABLE_COLUMNS = ['title', 'description', 'location'] as const;
const SORTABLE_COLUMNS = ['created_at', 'deadline', 'title'] as const;

/** Statuses a member may see. Drafts stay with the author and their company. */
const VISIBLE_STATUSES = [OpportunityStatus.Open, OpportunityStatus.Closed, OpportunityStatus.Archived];

/**
 * One table backs jobs, projects and supplier requests: they share a lifecycle
 * and differ only by `type`, so submissions can later hang off a single
 * `opportunity_id` rather than three parallel sets of tables.
 */
@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(context: AuthContext, dto: CreateOpportunityDto): Promise<OpportunityEntity> {
    if (dto.company_id) {
      await this.companiesService.assertCompanyMember(dto.company_id, context);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.OPPORTUNITIES)
      .insert({
        company_id: dto.company_id ?? null,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        location: dto.location ?? null,
        deadline: dto.deadline ?? null,
        status: dto.status ?? OpportunityStatus.Draft,
        created_by: context.profileId,
      })
      .select('*')
      .single<OpportunityEntity>();

    if (error || !data) {
      this.logger.error(`Failed to create opportunity: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the opportunity');
    }

    return data;
  }

  async findAll(
    query: ListOpportunitiesQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<OpportunityEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'created_at',
      ascending: false,
    });

    // A status filter can only narrow the publicly visible set, never widen it
    // into another author's drafts.
    const statuses =
      query.status && VISIBLE_STATUSES.includes(query.status) ? [query.status] : VISIBLE_STATUSES;

    let request = this.databaseService.admin
      .from(Tables.OPPORTUNITIES)
      .select('*', { count: 'exact' })
      .in('status', statuses);

    // `type` and `status` are enum-validated by the DTO, so they can only ever
    // be one of the known values.
    if (query.type) {
      request = request.eq('type', query.type);
    }
    if (query.company_id) {
      request = request.eq('company_id', query.company_id);
    }

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list opportunities: ${error.message}`);
      throw new InternalOperationException('Unable to list opportunities');
    }

    return { data: (data ?? []) as OpportunityEntity[], total: count ?? 0 };
  }

  async findById(id: UUID, context: AuthContext): Promise<OpportunityEntity> {
    const opportunity = await this.loadById(id);

    if (!VISIBLE_STATUSES.includes(opportunity.status) && !(await this.canManage(opportunity, context))) {
      throw new NotFoundException('Opportunity', id);
    }

    return opportunity;
  }

  async update(
    id: UUID,
    dto: UpdateOpportunityDto,
    context: AuthContext,
  ): Promise<OpportunityEntity> {
    const opportunity = await this.loadById(id);
    await this.assertCanManage(opportunity, context);

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return opportunity;
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.OPPORTUNITIES)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<OpportunityEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update opportunity ${id}: ${error?.message ?? 'no row'}`);
      throw new InternalOperationException('Unable to update the opportunity');
    }

    return data;
  }

  async remove(id: UUID, context: AuthContext): Promise<void> {
    const opportunity = await this.loadById(id);
    await this.assertCanManage(opportunity, context);

    const { error } = await this.databaseService.admin
      .from(Tables.OPPORTUNITIES)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete opportunity ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the opportunity');
    }
  }

  private async loadById(id: UUID): Promise<OpportunityEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.OPPORTUNITIES)
      .select('*')
      .eq('id', id)
      .maybeSingle<OpportunityEntity>();

    if (error) {
      this.logger.error(`Failed to load opportunity ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the opportunity');
    }

    if (!data) {
      throw new NotFoundException('Opportunity', id);
    }

    return data;
  }

  private async canManage(opportunity: OpportunityEntity, context: AuthContext): Promise<boolean> {
    if (
      hasPermission(context.role, Permission.OPPORTUNITY_MANAGE_ANY) ||
      opportunity.created_by === context.profileId
    ) {
      return true;
    }

    if (opportunity.company_id) {
      return this.companiesService.isCompanyAdmin(opportunity.company_id, context);
    }

    return false;
  }

  private async assertCanManage(
    opportunity: OpportunityEntity,
    context: AuthContext,
  ): Promise<void> {
    if (!(await this.canManage(opportunity, context))) {
      throw new ForbiddenException('You cannot manage this opportunity');
    }
  }
}
