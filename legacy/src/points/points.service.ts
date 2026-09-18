import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import {
  PointBalance,
  PointsTransactionEntity,
  PointsTransactionType,
  PointsReferenceType,
} from './points.types';
import { AuthContext } from '../auth/types/auth-context';
import { RpcFunctions, Tables } from '../common/constants';
import {
  BadRequestException,
  InternalOperationException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';

export interface AwardPointsCommand {
  profileId: UUID;
  amount: number;
  type: PointsTransactionType;
  referenceType: PointsReferenceType;
  referenceId: UUID;
  description: string;
}

/** Raised by the `award_points` function when a debit would go below zero. */
const INSUFFICIENT_BALANCE = 'insufficient_points';

/**
 * Owns the points ledger.
 *
 * `points_transactions` is the source of truth and `point_balances` is a
 * derived cache; both are written by one transactional Postgres function that
 * locks the balance row, so concurrent awards and spends cannot interleave into
 * a wrong total or a negative balance.
 *
 * There is deliberately no route that lets a client name itself as the
 * recipient: every caller of `award` is backend code reacting to a verified
 * event (a completed course, a redeemed reward, an administrative adjustment).
 */
@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async award(command: AwardPointsCommand, actorProfileId: UUID): Promise<PointsTransactionEntity> {
    if (!Number.isInteger(command.amount) || command.amount === 0) {
      throw new BadRequestException('Points amount must be a non-zero integer');
    }

    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.AWARD_POINTS, {
        p_user_id: command.profileId,
        p_amount: command.amount,
        p_type: command.type,
        p_reference_type: command.referenceType,
        p_reference_id: command.referenceId,
        p_description: command.description,
      })
      .single<PointsTransactionEntity>();

    if (error) {
      if (error.message.includes(INSUFFICIENT_BALANCE)) {
        throw new BadRequestException('Insufficient points balance');
      }
      this.logger.error(`Points award failed: ${error.message}`);
      throw new InternalOperationException('Unable to record the points transaction');
    }

    await this.auditService.log({
      actor_id: actorProfileId,
      action: AuditAction.POINTS_ADJUSTED,
      entity_type: 'points_transaction',
      entity_id: data.id,
      metadata: {
        user_id: command.profileId,
        amount: command.amount,
        type: command.type,
        reference_type: command.referenceType,
        reference_id: command.referenceId,
      },
    });

    return data;
  }

  async getBalance(profileId: UUID): Promise<PointBalance> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.POINT_BALANCES)
      .select('balance, updated_at')
      .eq('user_id', profileId)
      .maybeSingle<{ balance: number; updated_at: string }>();

    if (error) {
      this.logger.error(`Balance lookup failed: ${error.message}`);
      throw new InternalOperationException('Unable to load the points balance');
    }

    return {
      user_id: profileId,
      balance: data?.balance ?? 0,
      updated_at: data?.updated_at ?? null,
    };
  }

  async listTransactions(
    context: AuthContext,
    pagination: PaginationParams,
  ): Promise<ListResult<PointsTransactionEntity>> {
    const { data, error, count } = await this.databaseService.admin
      .from(Tables.POINTS_TRANSACTIONS)
      .select('*', { count: 'exact' })
      // Scoped to the caller's own profile id, taken from the verified token.
      .eq('user_id', context.profileId)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Transaction listing failed: ${error.message}`);
      throw new InternalOperationException('Unable to load the points ledger');
    }

    return { data: (data ?? []) as PointsTransactionEntity[], total: count ?? 0 };
  }
}
