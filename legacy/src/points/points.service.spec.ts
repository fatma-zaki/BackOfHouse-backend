import { PointsService } from './points.service';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { PointsReferenceType, PointsTransactionType } from './points.types';
import { AuthContext } from '../auth/types/auth-context';
import { Role } from '../auth/decorators/permissions.enum';
import { BadRequestException } from '../common/exceptions/business.exceptions';
import { RpcFunctions, Tables } from '../common/constants';
import { FakeSupabaseClient } from '../../test/support/fake-supabase';

const OWNER = 'aaaa2222-2222-4222-8222-222222222222';
const OTHER = 'aaaa3333-3333-4333-8333-333333333333';
const ADMIN = 'aaaa1111-1111-4111-8111-111111111111';

const owner: AuthContext = {
  authUserId: 'auth-owner',
  profileId: OWNER,
  email: 'ada@example.test',
  role: Role.USER,
  accessToken: 'token',
};

describe('PointsService', () => {
  let supabase: FakeSupabaseClient;
  let service: PointsService;

  beforeEach(() => {
    supabase = new FakeSupabaseClient();
    supabase.seed(Tables.POINT_BALANCES, [
      { id: 'pb-1', user_id: OWNER, balance: 400, updated_at: '2026-09-01T00:00:00.000Z' },
    ]);
    supabase.seed(Tables.POINTS_TRANSACTIONS, [
      { id: 'tx-1', user_id: OWNER, amount: 400, type: 'earned', created_at: '2026-09-01T00:00:00.000Z' },
      { id: 'tx-2', user_id: OTHER, amount: 900, type: 'earned', created_at: '2026-09-02T00:00:00.000Z' },
    ]);
    supabase.seed(Tables.AUDIT_LOGS, []);

    const databaseService = { admin: supabase } as unknown as DatabaseService;
    service = new PointsService(databaseService, new AuditService(databaseService));
  });

  it('refuses a zero-amount adjustment before reaching the database', async () => {
    await expect(
      service.award(
        {
          profileId: OWNER,
          amount: 0,
          type: PointsTransactionType.AdminAdjustment,
          referenceType: PointsReferenceType.AdminAdjustment,
          referenceId: OWNER,
          description: 'noop',
        },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a fractional amount', async () => {
    await expect(
      service.award(
        {
          profileId: OWNER,
          amount: 10.5,
          type: PointsTransactionType.AdminAdjustment,
          referenceType: PointsReferenceType.AdminAdjustment,
          referenceId: OWNER,
          description: 'fraction',
        },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('translates the database refusal of an overdraft into a 400', async () => {
    supabase.rpcHandlers.set(RpcFunctions.AWARD_POINTS, () => ({
      data: null,
      error: { message: 'insufficient_points' },
    }));

    await expect(
      service.award(
        {
          profileId: OWNER,
          amount: -5000,
          type: PointsTransactionType.Spent,
          referenceType: PointsReferenceType.RewardRedemption,
          referenceId: OWNER,
          description: 'overdraft',
        },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records who performed an adjustment, not just who received it', async () => {
    supabase.rpcHandlers.set(RpcFunctions.AWARD_POINTS, (args) => ({
      data: {
        id: 'tx-new',
        user_id: args['p_user_id'],
        amount: args['p_amount'],
        type: args['p_type'],
        reference_type: args['p_reference_type'],
        reference_id: args['p_reference_id'],
        description: args['p_description'],
        created_at: new Date().toISOString(),
      },
      error: null,
    }));

    await service.award(
      {
        profileId: OWNER,
        amount: 250,
        type: PointsTransactionType.AdminAdjustment,
        referenceType: PointsReferenceType.AdminAdjustment,
        referenceId: OWNER,
        description: 'Goodwill credit',
      },
      ADMIN,
    );

    const entry = supabase.rowsOf(Tables.AUDIT_LOGS)[0];
    expect(entry['actor_id']).toBe(ADMIN);
    expect((entry['metadata'] as Record<string, unknown>)['user_id']).toBe(OWNER);
  });

  it('reads the balance of the profile it is asked about', async () => {
    await expect(service.getBalance(OWNER)).resolves.toMatchObject({ balance: 400 });
  });

  it('reports zero rather than failing when no balance row exists yet', async () => {
    await expect(service.getBalance(OTHER)).resolves.toMatchObject({ balance: 0 });
  });

  it('never returns another member ledger entries', async () => {
    const result = await service.listTransactions(owner, { page: 1, limit: 20, offset: 0 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].user_id).toBe(OWNER);
  });
});
