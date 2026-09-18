import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { CreateRewardDto, UpdateRewardDto } from './dto/reward.dto';
import { RedemptionStatus, RewardEntity, RewardRedemptionEntity, RewardStatus } from './reward.types';
import { AuthContext } from '../auth/types/auth-context';
import { RpcFunctions, Tables } from '../common/constants';
import {
  BadRequestException,
  ConflictException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { resolveSort } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'points_cost',
  'stock',
  'status',
  'expires_at',
  'image_url',
] as const;

const SORTABLE_COLUMNS = ['points_cost', 'created_at', 'expires_at'] as const;

/**
 * Errors raised by the `redeem_reward` transaction, mapped to HTTP responses.
 * The database is the arbiter: it decides inside one transaction whether the
 * redemption is possible, so two concurrent requests cannot both succeed.
 */
const REDEMPTION_ERRORS: Record<string, () => Error> = {
  reward_not_found: () => new NotFoundException('Reward'),
  reward_unavailable: () => new BadRequestException('This reward is not currently available'),
  reward_expired: () => new BadRequestException('This reward has expired'),
  reward_out_of_stock: () => new ConflictException('This reward is out of stock'),
  insufficient_points: () => new BadRequestException('Insufficient points balance'),
  duplicate_redemption: () =>
    new ConflictException('You already have a pending redemption for this reward'),
};

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateRewardDto, context: AuthContext): Promise<RewardEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.REWARDS)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        points_cost: dto.points_cost,
        stock: dto.stock ?? 0,
        status: RewardStatus.Active,
        expires_at: dto.expires_at ?? null,
        image_url: dto.image_url ?? null,
      })
      .select('*')
      .single<RewardEntity>();

    if (error || !data) {
      this.logger.error(`Failed to create reward: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the reward');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REWARD_CREATED,
      entity_type: 'reward',
      entity_id: data.id,
      metadata: { points_cost: data.points_cost, stock: data.stock },
    });

    return data;
  }

  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<RewardEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'points_cost',
      ascending: true,
    });

    const { data, error, count } = await this.databaseService.admin
      .from(Tables.REWARDS)
      .select('*', { count: 'exact' })
      .eq('status', RewardStatus.Active)
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list rewards: ${error.message}`);
      throw new InternalOperationException('Unable to list rewards');
    }

    return { data: (data ?? []) as RewardEntity[], total: count ?? 0 };
  }

  async findById(id: UUID): Promise<RewardEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.REWARDS)
      .select('*')
      .eq('id', id)
      .maybeSingle<RewardEntity>();

    if (error) {
      this.logger.error(`Failed to load reward ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the reward');
    }

    if (!data) {
      throw new NotFoundException('Reward', id);
    }

    return data;
  }

  async update(id: UUID, dto: UpdateRewardDto, context: AuthContext): Promise<RewardEntity> {
    await this.findById(id);

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return this.findById(id);
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.REWARDS)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<RewardEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update reward ${id}: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the reward');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REWARD_UPDATED,
      entity_type: 'reward',
      entity_id: id,
      metadata: { fields: Object.keys(payload) },
    });

    return data;
  }

  async remove(id: UUID, context: AuthContext): Promise<void> {
    await this.findById(id);

    const { error } = await this.databaseService.admin.from(Tables.REWARDS).delete().eq('id', id);

    if (error) {
      // Redemptions reference rewards with ON DELETE RESTRICT, so a reward that
      // has been redeemed is retired by setting its status instead.
      this.logger.warn(`Failed to delete reward ${id}: ${error.message}`);
      throw new ConflictException('This reward has been redeemed and can only be deactivated');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REWARD_DELETED,
      entity_type: 'reward',
      entity_id: id,
    });
  }

  /**
   * Redeems a reward for the caller.
   *
   * Availability, stock, the points debit and the redemption record are all
   * handled by one Postgres function running in a single transaction with the
   * reward and balance rows locked. Either every part commits or none does, so
   * there is no window in which points are spent without a redemption, and a
   * second concurrent request finds the stock already claimed.
   */
  async redeem(rewardId: UUID, context: AuthContext): Promise<RewardRedemptionEntity> {
    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.REDEEM_REWARD, {
        p_user_id: context.profileId,
        p_reward_id: rewardId,
      })
      .single<RewardRedemptionEntity>();

    if (error) {
      const known = Object.keys(REDEMPTION_ERRORS).find((key) => error.message.includes(key));
      if (known) {
        throw REDEMPTION_ERRORS[known]();
      }
      this.logger.error(`Redemption failed for reward ${rewardId}: ${error.message}`);
      throw new InternalOperationException('Unable to complete the redemption');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REWARD_REDEEMED,
      entity_type: 'reward_redemption',
      entity_id: data.id,
      metadata: { reward_id: rewardId, points_cost: data.points_cost },
    });

    return data;
  }

  /**
   * Marks a pending redemption as handed over. The update is conditional on the
   * current status, so fulfilling twice, or fulfilling a cancelled redemption,
   * matches no row.
   */
  async fulfilRedemption(redemptionId: UUID, context: AuthContext): Promise<RewardRedemptionEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.REWARD_REDEMPTIONS)
      .update({ status: RedemptionStatus.Fulfilled, fulfilled_at: new Date().toISOString() })
      .eq('id', redemptionId)
      .eq('status', RedemptionStatus.Pending)
      .select('*')
      .maybeSingle<RewardRedemptionEntity>();

    if (error) {
      this.logger.error(`Failed to fulfil redemption ${redemptionId}: ${error.message}`);
      throw new InternalOperationException('Unable to fulfil the redemption');
    }

    if (!data) {
      throw new ConflictException('Only a pending redemption can be fulfilled');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REDEMPTION_FULFILLED,
      entity_type: 'reward_redemption',
      entity_id: redemptionId,
    });

    return data;
  }

  /** Cancels a pending redemption, refunding points and stock atomically. */
  async cancelRedemption(redemptionId: UUID, context: AuthContext): Promise<RewardRedemptionEntity> {
    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.CANCEL_REDEMPTION, { p_redemption_id: redemptionId })
      .single<RewardRedemptionEntity>();

    if (error) {
      if (error.message.includes('redemption_not_found')) {
        throw new NotFoundException('Redemption', redemptionId);
      }
      if (error.message.includes('redemption_not_pending')) {
        throw new ConflictException('Only a pending redemption can be cancelled');
      }
      this.logger.error(`Failed to cancel redemption ${redemptionId}: ${error.message}`);
      throw new InternalOperationException('Unable to cancel the redemption');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.REDEMPTION_CANCELLED,
      entity_type: 'reward_redemption',
      entity_id: redemptionId,
      metadata: { refunded_points: data.points_cost, user_id: data.user_id },
    });

    return data;
  }

  async listOwnRedemptions(
    context: AuthContext,
    pagination: PaginationParams,
  ): Promise<ListResult<RewardRedemptionEntity>> {
    const { data, error, count } = await this.databaseService.admin
      .from(Tables.REWARD_REDEMPTIONS)
      .select('*', { count: 'exact' })
      .eq('user_id', context.profileId)
      .order('redeemed_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list redemptions: ${error.message}`);
      throw new InternalOperationException('Unable to list redemptions');
    }

    return { data: (data ?? []) as RewardRedemptionEntity[], total: count ?? 0 };
  }
}
