import { RewardsService } from './rewards.service';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { RewardStatus } from './reward.types';
import { AuthContext } from '../auth/types/auth-context';
import { Role } from '../auth/decorators/permissions.enum';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { RpcFunctions, Tables } from '../common/constants';
import { FakeSupabaseClient } from '../../test/support/fake-supabase';

const REWARD_ID = 'b1b1b1b1-1111-4111-8111-111111111111';
const PROFILE_ID = 'aaaa2222-2222-4222-8222-222222222222';

const member: AuthContext = {
  authUserId: 'auth-member',
  profileId: PROFILE_ID,
  email: 'ada@example.test',
  role: Role.USER,
  accessToken: 'token',
};

describe('RewardsService redemption', () => {
  let supabase: FakeSupabaseClient;
  let service: RewardsService;

  beforeEach(() => {
    supabase = new FakeSupabaseClient();
    supabase.seed(Tables.REWARDS, [
      {
        id: REWARD_ID,
        title: 'Knife skills masterclass seat',
        points_cost: 500,
        stock: 1,
        status: RewardStatus.Active,
        expires_at: null,
      },
    ]);
    supabase.seed(Tables.REWARD_REDEMPTIONS, []);
    supabase.seed(Tables.AUDIT_LOGS, []);

    const databaseService = { admin: supabase } as unknown as DatabaseService;
    service = new RewardsService(databaseService, new AuditService(databaseService));
  });

  function respondWith(error: string): void {
    supabase.rpcHandlers.set(RpcFunctions.REDEEM_REWARD, () => ({
      data: null,
      error: { message: `error: ${error}` },
    }));
  }

  it('records the redemption and audits it when the transaction succeeds', async () => {
    supabase.rpcHandlers.set(RpcFunctions.REDEEM_REWARD, (args) => ({
      data: {
        id: 'redemption-1',
        reward_id: args['p_reward_id'],
        user_id: args['p_user_id'],
        points_cost: 500,
        status: 'pending',
        redeemed_at: new Date().toISOString(),
        fulfilled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    }));

    const redemption = await service.redeem(REWARD_ID, member);

    expect(redemption.user_id).toBe(PROFILE_ID);
    const entry = supabase.rowsOf(Tables.AUDIT_LOGS)[0];
    expect(entry['action']).toBe('REWARD_REDEEMED');
    expect(entry['actor_id']).toBe(PROFILE_ID);
  });

  it('redeems for the caller, never for a profile named by the request', async () => {
    let seenUserId: unknown;
    supabase.rpcHandlers.set(RpcFunctions.REDEEM_REWARD, (args) => {
      seenUserId = args['p_user_id'];
      return { data: { id: 'r-1', points_cost: 500 }, error: null };
    });

    await service.redeem(REWARD_ID, member);

    expect(seenUserId).toBe(PROFILE_ID);
  });

  it.each([
    ['insufficient_points', BadRequestException],
    ['reward_unavailable', BadRequestException],
    ['reward_expired', BadRequestException],
  ])('maps %s to a 400', async (code, expected) => {
    respondWith(code);

    await expect(service.redeem(REWARD_ID, member)).rejects.toBeInstanceOf(expected);
  });

  it.each([
    ['reward_out_of_stock', ConflictException],
    ['duplicate_redemption', ConflictException],
  ])('maps %s to a 409', async (code, expected) => {
    respondWith(code);

    await expect(service.redeem(REWARD_ID, member)).rejects.toBeInstanceOf(expected);
  });

  it('maps reward_not_found to a 404', async () => {
    respondWith('reward_not_found');

    await expect(service.redeem(REWARD_ID, member)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides an unexpected database failure behind a generic error', async () => {
    supabase.rpcHandlers.set(RpcFunctions.REDEEM_REWARD, () => ({
      data: null,
      error: { message: 'deadlock detected on relation reward_redemptions' },
    }));

    await expect(service.redeem(REWARD_ID, member)).rejects.toMatchObject({
      message: 'Unable to complete the redemption',
    });
  });

  it('leaves no redemption behind when the transaction refuses', async () => {
    respondWith('insufficient_points');

    await expect(service.redeem(REWARD_ID, member)).rejects.toBeInstanceOf(BadRequestException);
    expect(supabase.rowsOf(Tables.REWARD_REDEMPTIONS)).toHaveLength(0);
  });

  describe('lifecycle', () => {
    beforeEach(() => {
      supabase.seed(Tables.REWARD_REDEMPTIONS, [
        { id: 'redemption-1', reward_id: REWARD_ID, user_id: PROFILE_ID, points_cost: 500, status: 'pending' },
      ]);
    });

    it('fulfils a pending redemption exactly once', async () => {
      const fulfilled = await service.fulfilRedemption('redemption-1', member);
      expect(fulfilled.status).toBe('fulfilled');

      await expect(service.fulfilRedemption('redemption-1', member)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('maps a repeated cancellation to a 409 instead of refunding again', async () => {
      supabase.rpcHandlers.set(RpcFunctions.CANCEL_REDEMPTION, () => ({
        data: null,
        error: { message: 'redemption_not_pending' },
      }));

      await expect(service.cancelRedemption('redemption-1', member)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('audits a successful cancellation with the refunded amount', async () => {
      supabase.rpcHandlers.set(RpcFunctions.CANCEL_REDEMPTION, () => ({
        data: { id: 'redemption-1', user_id: PROFILE_ID, points_cost: 500, status: 'cancelled' },
        error: null,
      }));

      await service.cancelRedemption('redemption-1', member);

      const entry = supabase.rowsOf(Tables.AUDIT_LOGS).find((row) => row['action'] === 'REDEMPTION_CANCELLED');
      expect((entry?.['metadata'] as Record<string, unknown>)['refunded_points']).toBe(500);
    });
  });
});
