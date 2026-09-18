import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { AddMemberDto, CreateCompanyDto, UpdateCompanyDto, UpdateMemberRoleDto } from './dto/company.dto';
import { CompanyEntity, CompanyMemberEntity, CompanyRole, CompanyStatus } from './company.types';
import { AuthContext } from '../auth/types/auth-context';
import { Permission, hasPermission } from '../auth/decorators/permissions.enum';
import {
  ConflictException,
  ForbiddenException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { RpcFunctions, Tables } from '../common/constants';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = [
  'name',
  'description',
  'website',
  'industry',
  'location',
  'logo_url',
  'cover_url',
] as const;

const SEARCHABLE_COLUMNS = ['name', 'industry', 'location'] as const;
const SORTABLE_COLUMNS = ['created_at', 'name'] as const;

/** Postgres unique-violation code, raised when two requests race on the same slug. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async create(context: AuthContext, dto: CreateCompanyDto): Promise<CompanyEntity> {
    // The company row and its first admin membership are written by a single
    // transactional function, so a company can never exist without an owner.
    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.CREATE_COMPANY_WITH_OWNER, {
        p_owner_profile_id: context.profileId,
        p_name: dto.name,
        p_slug: dto.slug,
        p_description: dto.description ?? null,
        p_website: dto.website ?? null,
        p_industry: dto.industry ?? null,
        p_location: dto.location ?? null,
        p_logo_url: dto.logo_url ?? null,
        p_cover_url: dto.cover_url ?? null,
      })
      .single<CompanyEntity>();

    if (error) {
      if (error.code === UNIQUE_VIOLATION || error.message.includes('slug_taken')) {
        throw new ConflictException('A company with this slug already exists');
      }
      this.logger.error(`Failed to create company: ${error.message}`);
      throw new InternalOperationException('Unable to create the company');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COMPANY_CREATED,
      entity_type: 'company',
      entity_id: data.id,
      metadata: { slug: data.slug },
    });

    return data;
  }

  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<CompanyEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'created_at',
      ascending: false,
    });

    let request = this.databaseService.admin
      .from(Tables.COMPANIES)
      .select('*', { count: 'exact' })
      .eq('status', CompanyStatus.Active);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list companies: ${error.message}`);
      throw new InternalOperationException('Unable to list companies');
    }

    return { data: (data ?? []) as CompanyEntity[], total: count ?? 0 };
  }

  async findById(id: UUID): Promise<CompanyEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANIES)
      .select('*')
      .eq('id', id)
      .maybeSingle<CompanyEntity>();

    if (error) {
      this.logger.error(`Failed to load company ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the company');
    }

    if (!data) {
      throw new NotFoundException('Company', id);
    }

    return data;
  }

  async update(id: UUID, dto: UpdateCompanyDto, context: AuthContext): Promise<CompanyEntity> {
    await this.assertCompanyAdmin(id, context);

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return this.findById(id);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANIES)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<CompanyEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update company ${id}: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the company');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COMPANY_UPDATED,
      entity_type: 'company',
      entity_id: id,
      metadata: { fields: Object.keys(payload) },
    });

    return data;
  }

  async remove(id: UUID, context: AuthContext): Promise<void> {
    await this.assertCompanyAdmin(id, context);

    const { error } = await this.databaseService.admin.from(Tables.COMPANIES).delete().eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete company ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the company');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COMPANY_DELETED,
      entity_type: 'company',
      entity_id: id,
    });
  }

  /** Membership is visible to members of that company and to platform admins. */
  async listMembers(companyId: UUID, context: AuthContext): Promise<CompanyMemberEntity[]> {
    await this.assertCompanyMember(companyId, context);

    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to list members of ${companyId}: ${error.message}`);
      throw new InternalOperationException('Unable to list company members');
    }

    return (data ?? []) as CompanyMemberEntity[];
  }

  async addMember(
    companyId: UUID,
    dto: AddMemberDto,
    context: AuthContext,
  ): Promise<CompanyMemberEntity> {
    await this.assertCompanyAdmin(companyId, context);
    await this.assertUserExists(dto.user_id);

    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .insert({ company_id: companyId, user_id: dto.user_id, role: dto.role })
      .select('*')
      .single<CompanyMemberEntity>();

    if (error || !data) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('This user is already a member of the company');
      }
      this.logger.error(`Failed to add member: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to add the company member');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.MEMBER_ADDED,
      entity_type: 'company_member',
      entity_id: data.id,
      metadata: { company_id: companyId, user_id: dto.user_id, role: dto.role },
    });

    return data;
  }

  async updateMemberRole(
    companyId: UUID,
    userId: UUID,
    dto: UpdateMemberRoleDto,
    context: AuthContext,
  ): Promise<CompanyMemberEntity> {
    await this.assertCompanyAdmin(companyId, context);

    const membership = await this.findMembership(companyId, userId);
    if (!membership) {
      throw new NotFoundException('Company member', userId);
    }

    if (membership.role === CompanyRole.Admin && dto.role !== CompanyRole.Admin) {
      await this.assertNotLastAdmin(companyId);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .update({ role: dto.role })
      .eq('id', membership.id)
      .select('*')
      .single<CompanyMemberEntity>();

    if (error || !data) {
      this.logger.error(`Failed to change member role: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the member role');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.ROLE_CHANGED,
      entity_type: 'company_member',
      entity_id: membership.id,
      metadata: { company_id: companyId, user_id: userId, from: membership.role, to: dto.role },
    });

    return data;
  }

  /** A company admin may remove anyone; any member may remove themselves. */
  async removeMember(companyId: UUID, userId: UUID, context: AuthContext): Promise<void> {
    const isSelf = userId === context.profileId;

    if (!isSelf) {
      await this.assertCompanyAdmin(companyId, context);
    } else {
      await this.assertCompanyMember(companyId, context);
    }

    const membership = await this.findMembership(companyId, userId);
    if (!membership) {
      throw new NotFoundException('Company member', userId);
    }

    if (membership.role === CompanyRole.Admin) {
      await this.assertNotLastAdmin(companyId);
    }

    const { error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .delete()
      .eq('id', membership.id);

    if (error) {
      this.logger.error(`Failed to remove member: ${error.message}`);
      throw new InternalOperationException('Unable to remove the company member');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.MEMBER_REMOVED,
      entity_type: 'company_member',
      entity_id: membership.id,
      metadata: { company_id: companyId, user_id: userId },
    });
  }

  async findMembership(companyId: UUID, profileId: UUID): Promise<CompanyMemberEntity | null> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', profileId)
      .maybeSingle<CompanyMemberEntity>();

    if (error) {
      this.logger.error(`Membership lookup failed: ${error.message}`);
      throw new InternalOperationException('Unable to verify company membership');
    }

    return data;
  }

  async isCompanyAdmin(companyId: UUID, context: AuthContext): Promise<boolean> {
    if (hasPermission(context.role, Permission.COMPANY_MANAGE_ANY)) {
      return true;
    }
    const membership = await this.findMembership(companyId, context.profileId);
    return membership?.role === CompanyRole.Admin;
  }

  async isCompanyMember(companyId: UUID, context: AuthContext): Promise<boolean> {
    if (hasPermission(context.role, Permission.COMPANY_MANAGE_ANY)) {
      return true;
    }
    return (await this.findMembership(companyId, context.profileId)) !== null;
  }

  /**
   * Resource-level authorization: holding a platform role is never enough to
   * administer an arbitrary company, the caller must administer *this* one.
   */
  async assertCompanyAdmin(companyId: UUID, context: AuthContext): Promise<void> {
    await this.findById(companyId);

    if (!(await this.isCompanyAdmin(companyId, context))) {
      throw new ForbiddenException('Only an administrator of this company can perform this action');
    }
  }

  async assertCompanyMember(companyId: UUID, context: AuthContext): Promise<void> {
    await this.findById(companyId);

    if (!(await this.isCompanyMember(companyId, context))) {
      throw new ForbiddenException('You are not a member of this company');
    }
  }

  private async assertUserExists(profileId: UUID): Promise<void> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.USERS)
      .select('id')
      .eq('id', profileId)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalOperationException('Unable to verify the user');
    }

    if (!data) {
      throw new NotFoundException('User', profileId);
    }
  }

  /** Stops a company from losing its last administrator. */
  private async assertNotLastAdmin(companyId: UUID): Promise<void> {
    const { count, error } = await this.databaseService.admin
      .from(Tables.COMPANY_MEMBERS)
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('role', CompanyRole.Admin);

    if (error) {
      throw new InternalOperationException('Unable to verify company administrators');
    }

    if ((count ?? 0) <= 1) {
      throw new ConflictException('A company must keep at least one administrator');
    }
  }
}
