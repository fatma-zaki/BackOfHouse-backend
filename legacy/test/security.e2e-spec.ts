import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestContext, apiPath, createTestApp, fixtures } from './support/test-app';
import { FakeSupabaseClient } from './support/fake-supabase';
import { Tables } from '../src/common/constants';

/**
 * End-to-end coverage for the paths where a mistake is a security incident:
 * authentication, role checks, resource ownership, input validation, pagination
 * limits and the points/rewards economy.
 */
describe('API security (e2e)', () => {
  let context: TestContext;
  let app: INestApplication;
  let supabase: FakeSupabaseClient;

  const bearer = (token: string): [string, string] => ['Authorization', `Bearer ${token}`];

  beforeEach(async () => {
    context = await createTestApp();
    app = context.app;
    supabase = context.supabase;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('authentication', () => {
    it('rejects a request with no Authorization header', async () => {
      const response = await request(app.getHttpServer()).get(apiPath('/users/me'));

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects a malformed Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/users/me'))
        .set('Authorization', 'token-member');

      expect(response.status).toBe(401);
    });

    it('rejects an unrecognised token', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/users/me'))
        .set(...bearer('not-a-real-token'));

      expect(response.status).toBe(401);
    });

    it('serves the caller their own profile when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/users/me'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(fixtures.memberProfileId);
      expect(response.body.data.email).toBe('ada.okonkwo@example.test');
    });

    it('derives identity from the token, ignoring any user id in the body', async () => {
      const response = await request(app.getHttpServer())
        .patch(apiPath('/users/me'))
        .set(...bearer(fixtures.memberToken))
        .send({ first_name: 'Adaeze', id: fixtures.outsiderProfileId });

      // The unknown property is rejected outright rather than silently ignored.
      expect(response.status).toBe(400);

      const outsider = supabase
        .rowsOf(Tables.USERS)
        .find((row) => row['id'] === fixtures.outsiderProfileId);
      expect(outsider?.['first_name']).toBe('Luca');
    });
  });

  describe('role-based authorization', () => {
    it('refuses reward creation to an ordinary member', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath('/rewards'))
        .set(...bearer(fixtures.memberToken))
        .send({ title: 'Free knives', points_cost: 1, stock: 99 });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(supabase.rowsOf(Tables.REWARDS)).toHaveLength(1);
    });

    it('allows reward creation for a platform administrator', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath('/rewards'))
        .set(...bearer(fixtures.adminToken))
        .send({ title: 'Cookbook bundle', points_cost: 300, stock: 5 });

      expect(response.status).toBe(201);
      expect(supabase.rowsOf(Tables.REWARDS)).toHaveLength(2);
    });

    it('refuses the audit trail to an ordinary member', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/audit-logs'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(403);
    });
  });

  describe('resource-level authorization', () => {
    it('lets an administrator of that company update it', async () => {
      const response = await request(app.getHttpServer())
        .patch(apiPath(`/companies/${fixtures.companyId}`))
        .set(...bearer(fixtures.memberToken))
        .send({ industry: 'Hospitality group' });

      expect(response.status).toBe(200);
      expect(response.body.data.industry).toBe('Hospitality group');
    });

    it('refuses a member of one company editing another company', async () => {
      const response = await request(app.getHttpServer())
        .patch(apiPath(`/companies/${fixtures.otherCompanyId}`))
        .set(...bearer(fixtures.memberToken))
        .send({ industry: 'Something else' });

      expect(response.status).toBe(403);

      const company = supabase
        .rowsOf(Tables.COMPANIES)
        .find((row) => row['id'] === fixtures.otherCompanyId);
      expect(company?.['industry']).toBe('Food supply');
    });

    it('refuses a non-member editing a company entirely', async () => {
      const response = await request(app.getHttpServer())
        .patch(apiPath(`/companies/${fixtures.companyId}`))
        .set(...bearer(fixtures.outsiderToken))
        .send({ industry: 'Hijacked' });

      expect(response.status).toBe(403);
    });

    it('lets a platform administrator override the company check', async () => {
      // The platform admin is only a plain member of this company; the plain
      // member refusal itself is covered in companies.service.spec.ts.
      const response = await request(app.getHttpServer())
        .patch(apiPath(`/companies/${fixtures.companyId}`))
        .set(...bearer(fixtures.adminToken))
        .send({ industry: 'Reviewed by platform' });

      expect(response.status).toBe(200);
    });

    it('hides the member list of a company the caller does not belong to', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath(`/companies/${fixtures.otherCompanyId}/members`))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(403);
    });
  });

  describe('input validation', () => {
    it('rejects a body with an invalid enum value', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath(`/companies/${fixtures.companyId}/members`))
        .set(...bearer(fixtures.memberToken))
        .send({ user_id: fixtures.outsiderProfileId, role: 'superuser' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects a malformed email at signup', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath('/auth/signup'))
        .send({ email: 'not-an-email', password: 'Sunrise-Kitchen-2026' });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'email' })]),
      );
    });

    it('rejects a weak password at signup', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath('/auth/signup'))
        .send({ email: 'new.chef@example.test', password: 'short' });

      expect(response.status).toBe(400);
    });

    it('rejects an unknown property instead of silently dropping it', async () => {
      const response = await request(app.getHttpServer())
        .patch(apiPath('/users/me'))
        .set(...bearer(fixtures.memberToken))
        .send({ first_name: 'Ada', status: 'suspended' });

      expect(response.status).toBe(400);
    });

    it('rejects a non-UUID path parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/companies/not-a-uuid'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('UUID');
    });

    it('returns 404 for a well-formed id that does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath(`/companies/${fixtures.unknownId}`))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(404);
    });
  });

  describe('pagination limits', () => {
    it('rejects a limit above the maximum', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/companies?limit=5000'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects a non-numeric page', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/companies?page=abc'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(400);
    });

    it('returns pagination metadata with defaults applied', async () => {
      const response = await request(app.getHttpServer())
        .get(apiPath('/companies'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(200);
      expect(response.body.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });
  });

  describe('points and rewards', () => {
    it('refuses a member awarding points to themselves', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath('/points/adjustments'))
        .set(...bearer(fixtures.memberToken))
        .send({ user_id: fixtures.memberProfileId, amount: 100000, description: 'free points' });

      expect(response.status).toBe(403);

      const balance = supabase
        .rowsOf(Tables.POINT_BALANCES)
        .find((row) => row['user_id'] === fixtures.memberProfileId);
      expect(balance?.['balance']).toBe(800);
    });

    it('only reports the caller their own ledger', async () => {
      supabase.rowsOf(Tables.POINTS_TRANSACTIONS).push(
        {
          id: 'tx-other',
          user_id: fixtures.outsiderProfileId,
          amount: 50,
          type: 'earned',
          created_at: new Date().toISOString(),
        },
        {
          id: 'tx-own',
          user_id: fixtures.memberProfileId,
          amount: 800,
          type: 'admin_adjustment',
          created_at: new Date().toISOString(),
        },
      );

      const response = await request(app.getHttpServer())
        .get(apiPath('/points/transactions'))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('tx-own');
    });

    it('debits the balance and records the redemption', async () => {
      const response = await request(app.getHttpServer())
        .post(apiPath(`/rewards/${fixtures.rewardId}/redeem`))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(201);
      expect(response.body.data.points_cost).toBe(500);

      const balance = supabase
        .rowsOf(Tables.POINT_BALANCES)
        .find((row) => row['user_id'] === fixtures.memberProfileId);
      expect(balance?.['balance']).toBe(300);
      expect(supabase.rowsOf(Tables.REWARD_REDEMPTIONS)).toHaveLength(1);
    });

    it('refuses a second redemption while one is still pending', async () => {
      await request(app.getHttpServer())
        .post(apiPath(`/rewards/${fixtures.rewardId}/redeem`))
        .set(...bearer(fixtures.memberToken));

      const second = await request(app.getHttpServer())
        .post(apiPath(`/rewards/${fixtures.rewardId}/redeem`))
        .set(...bearer(fixtures.memberToken));

      expect(second.status).toBe(409);
      expect(supabase.rowsOf(Tables.REWARD_REDEMPTIONS)).toHaveLength(1);

      const balance = supabase
        .rowsOf(Tables.POINT_BALANCES)
        .find((row) => row['user_id'] === fixtures.memberProfileId);
      expect(balance?.['balance']).toBe(300);
    });

    it('refuses a redemption the caller cannot afford', async () => {
      const reward = supabase.rowsOf(Tables.REWARDS)[0];
      reward['points_cost'] = 5000;

      const response = await request(app.getHttpServer())
        .post(apiPath(`/rewards/${fixtures.rewardId}/redeem`))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient points');
      expect(supabase.rowsOf(Tables.REWARD_REDEMPTIONS)).toHaveLength(0);
    });

    it('refuses a redemption when the reward is out of stock', async () => {
      const reward = supabase.rowsOf(Tables.REWARDS)[0];
      reward['stock'] = 0;

      const response = await request(app.getHttpServer())
        .post(apiPath(`/rewards/${fixtures.rewardId}/redeem`))
        .set(...bearer(fixtures.memberToken));

      expect(response.status).toBe(409);
    });
  });

  describe('health', () => {
    it('answers the liveness probe without authentication or detail', async () => {
      const response = await request(app.getHttpServer()).get(apiPath('/health'));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: { status: 'ok' } });
    });
  });

  describe('error format', () => {
    it('uses the same envelope for every failure', async () => {
      const response = await request(app.getHttpServer()).get(apiPath('/companies'));

      expect(response.body).toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        path: apiPath('/companies'),
      });
      expect(typeof response.body.timestamp).toBe('string');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});
