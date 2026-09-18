import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUserProfile, UserEntity, UserStatus } from './user.types';
import { AuthContext } from '../auth/types/auth-context';
import { InternalOperationException, NotFoundException } from '../common/exceptions/business.exceptions';
import { PUBLIC_USER_COLUMNS, Tables } from '../common/constants';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

/** Columns a user is allowed to change on their own profile. */
const SELF_EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'bio',
  'location',
  'job_title',
  'years_of_experience',
  'avatar_url',
] as const;

const SEARCHABLE_COLUMNS = ['first_name', 'last_name', 'job_title', 'location'] as const;
const SORTABLE_COLUMNS = ['created_at', 'last_name', 'years_of_experience'] as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** The caller's own profile, including PII. */
  async getOwnProfile(context: AuthContext): Promise<UserEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.USERS)
      .select('*')
      .eq('id', context.profileId)
      .maybeSingle<UserEntity>();

    if (error) {
      this.logger.error(`Failed to load own profile: ${error.message}`);
      throw new InternalOperationException('Unable to load the profile');
    }

    if (!data) {
      throw new NotFoundException('User profile');
    }

    return data;
  }

  /**
   * Updates the caller's own profile. The identity comes from the verified
   * token, so one user can never target another user's row.
   */
  async updateOwnProfile(context: AuthContext, dto: UpdateUserDto): Promise<UserEntity> {
    const payload = pickDefined(dto, SELF_EDITABLE_FIELDS);

    if (!hasUpdates(payload)) {
      return this.getOwnProfile(context);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.USERS)
      .update(payload)
      .eq('id', context.profileId)
      .select('*')
      .single<UserEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update profile: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the profile');
    }

    return data;
  }

  /** Public projection of another member. Never exposes email or phone. */
  async findPublicById(id: UUID): Promise<PublicUserProfile> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.USERS)
      .select(PUBLIC_USER_COLUMNS)
      .eq('id', id)
      .eq('status', UserStatus.Active)
      .maybeSingle<PublicUserProfile>();

    if (error) {
      this.logger.error(`Failed to load user ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the user');
    }

    if (!data) {
      throw new NotFoundException('User', id);
    }

    return data;
  }

  async listPublic(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<PublicUserProfile>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'created_at',
      ascending: false,
    });

    let request = this.databaseService.admin
      .from(Tables.USERS)
      .select(PUBLIC_USER_COLUMNS, { count: 'exact' })
      .eq('status', UserStatus.Active);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list users: ${error.message}`);
      throw new InternalOperationException('Unable to list users');
    }

    return { data: (data ?? []) as PublicUserProfile[], total: count ?? 0 };
  }
}
