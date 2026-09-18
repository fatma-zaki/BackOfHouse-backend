import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';
import { API_PREFIX } from '../../src/common/constants';
import { ValidationException } from '../../src/common/pipes/validation.pipe';
import { FakeSupabaseClient, FakeAuthUser, QueryResult, Row } from './fake-supabase';
import { Role } from '../../src/auth/decorators/permissions.enum';
import { UserStatus } from '../../src/users/user.types';
import { CompanyRole, CompanyStatus } from '../../src/companies/company.types';
import { RewardStatus } from '../../src/rewards/reward.types';
import { RpcFunctions, Tables } from '../../src/common/constants';

/** Fixtures shared by the end-to-end specs. */
export const fixtures = {
  memberToken: 'token-member',
  adminToken: 'token-platform-admin',
  outsiderToken: 'token-outsider',
  memberAuthId: '22222222-2222-4222-8222-222222222222',
  memberProfileId: 'aaaa2222-2222-4222-8222-222222222222',
  outsiderAuthId: '33333333-3333-4333-8333-333333333333',
  outsiderProfileId: 'aaaa3333-3333-4333-8333-333333333333',
  adminAuthId: '11111111-1111-4111-8111-111111111111',
  adminProfileId: 'aaaa1111-1111-4111-8111-111111111111',
  companyId: 'bbbb1111-1111-4111-8111-111111111111',
  otherCompanyId: 'bbbb2222-2222-4222-8222-222222222222',
  rewardId: 'b1b1b1b1-1111-4111-8111-111111111111',
  unknownId: '99999999-9999-4999-8999-999999999999',
};

function authUser(id: string, email: string, role: Role): FakeAuthUser {
  return {
    id,
    email,
    app_metadata: { app_role: role },
    user_metadata: {},
    email_confirmed_at: new Date().toISOString(),
  };
}

export function buildFakeSupabase(): FakeSupabaseClient {
  const client = new FakeSupabaseClient();

  client.sessions.set(
    fixtures.memberToken,
    authUser(fixtures.memberAuthId, 'ada.okonkwo@example.test', Role.USER),
  );
  client.sessions.set(
    fixtures.outsiderToken,
    authUser(fixtures.outsiderAuthId, 'luca.moretti@example.test', Role.USER),
  );
  client.sessions.set(
    fixtures.adminToken,
    authUser(fixtures.adminAuthId, 'platform.admin@backofhouse.test', Role.PLATFORM_ADMIN),
  );

  client.seed(
    Tables.USERS,
    [
      {
        id: fixtures.memberProfileId,
        auth_user_id: fixtures.memberAuthId,
        email: 'ada.okonkwo@example.test',
        phone: null,
        first_name: 'Ada',
        last_name: 'Okonkwo',
        avatar_url: null,
        bio: null,
        location: 'Porto, Portugal',
        job_title: 'Head Pastry Chef',
        years_of_experience: 12,
        status: UserStatus.Active,
      },
      {
        id: fixtures.outsiderProfileId,
        auth_user_id: fixtures.outsiderAuthId,
        email: 'luca.moretti@example.test',
        phone: null,
        first_name: 'Luca',
        last_name: 'Moretti',
        avatar_url: null,
        bio: null,
        location: 'Lisbon, Portugal',
        job_title: 'Restaurant Manager',
        years_of_experience: 7,
        status: UserStatus.Active,
      },
      {
        id: fixtures.adminProfileId,
        auth_user_id: fixtures.adminAuthId,
        email: 'platform.admin@backofhouse.test',
        phone: null,
        first_name: 'Robin',
        last_name: 'Vasquez',
        avatar_url: null,
        bio: null,
        location: 'Lisbon, Portugal',
        job_title: 'Editor',
        years_of_experience: 9,
        status: UserStatus.Active,
      },
    ],
    [['auth_user_id']],
  );

  client.seed(Tables.COMPANIES, [
    {
      id: fixtures.companyId,
      name: 'Harbour Table Group',
      slug: 'harbour-table-group',
      description: null,
      website: null,
      industry: 'Hospitality',
      location: 'Lisbon, Portugal',
      logo_url: null,
      cover_url: null,
      status: CompanyStatus.Active,
    },
    {
      id: fixtures.otherCompanyId,
      name: 'Terra Produce Co-op',
      slug: 'terra-produce-co-op',
      description: null,
      website: null,
      industry: 'Food supply',
      location: 'Faro, Portugal',
      logo_url: null,
      cover_url: null,
      status: CompanyStatus.Active,
    },
  ]);

  // Ada administers Harbour Table; Luca belongs to no company at all.
  client.seed(
    Tables.COMPANY_MEMBERS,
    [
      {
        id: 'cm-1',
        company_id: fixtures.companyId,
        user_id: fixtures.memberProfileId,
        role: CompanyRole.Admin,
      },
      {
        id: 'cm-2',
        company_id: fixtures.companyId,
        user_id: fixtures.adminProfileId,
        role: CompanyRole.Member,
      },
    ],
    [['company_id', 'user_id']],
  );

  client.seed(Tables.REWARDS, [
    {
      id: fixtures.rewardId,
      title: 'Knife skills masterclass seat',
      description: null,
      points_cost: 500,
      stock: 2,
      status: RewardStatus.Active,
      expires_at: null,
      image_url: null,
    },
  ]);

  client.seed(Tables.POINT_BALANCES, [
    { id: 'pb-1', user_id: fixtures.memberProfileId, balance: 800 },
  ]);
  client.seed(Tables.POINTS_TRANSACTIONS, []);
  client.seed(Tables.REWARD_REDEMPTIONS, [], [['reward_id', 'user_id', 'status']]);
  client.seed(Tables.AUDIT_LOGS, []);

  registerRpcHandlers(client);
  return client;
}

/**
 * Mirrors the Postgres functions closely enough to test how the API reacts to
 * each outcome. The real atomicity guarantees live in the migration.
 */
function registerRpcHandlers(client: FakeSupabaseClient): void {
  client.rpcHandlers.set(RpcFunctions.REDEEM_REWARD, (args) => {
    const userId = args['p_user_id'] as string;
    const rewardId = args['p_reward_id'] as string;
    const reward = client.rowsOf(Tables.REWARDS).find((row) => row['id'] === rewardId);

    if (!reward) {
      return { data: null, error: { message: 'reward_not_found' } };
    }
    if (reward['status'] !== RewardStatus.Active) {
      return { data: null, error: { message: 'reward_unavailable' } };
    }
    if ((reward['stock'] as number) <= 0) {
      return { data: null, error: { message: 'reward_out_of_stock' } };
    }

    const alreadyPending = client
      .rowsOf(Tables.REWARD_REDEMPTIONS)
      .some((row) => row['reward_id'] === rewardId && row['user_id'] === userId && row['status'] === 'pending');
    if (alreadyPending) {
      return { data: null, error: { message: 'duplicate_redemption' } };
    }

    const balanceRow = client.rowsOf(Tables.POINT_BALANCES).find((row) => row['user_id'] === userId);
    const balance = (balanceRow?.['balance'] as number) ?? 0;
    const cost = reward['points_cost'] as number;

    if (balance < cost) {
      return { data: null, error: { message: 'insufficient_points' } };
    }

    if (balanceRow) {
      balanceRow['balance'] = balance - cost;
    }
    reward['stock'] = (reward['stock'] as number) - 1;

    const redemption: Row = {
      id: `redemption-${client.rowsOf(Tables.REWARD_REDEMPTIONS).length + 1}`,
      reward_id: rewardId,
      user_id: userId,
      points_cost: cost,
      status: 'pending',
      redeemed_at: new Date().toISOString(),
      fulfilled_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    client.rowsOf(Tables.REWARD_REDEMPTIONS).push(redemption);
    client.rowsOf(Tables.POINTS_TRANSACTIONS).push({
      id: `tx-${client.rowsOf(Tables.POINTS_TRANSACTIONS).length + 1}`,
      user_id: userId,
      amount: -cost,
      type: 'spent',
      reference_type: 'reward_redemption',
      reference_id: rewardId,
      description: 'Redeemed reward',
      created_at: new Date().toISOString(),
    });

    return { data: redemption, error: null };
  });

  client.rpcHandlers.set(RpcFunctions.AWARD_POINTS, (args): QueryResult<Row> => {
    const userId = args['p_user_id'] as string;
    const amount = args['p_amount'] as number;
    const balanceRow = client.rowsOf(Tables.POINT_BALANCES).find((row) => row['user_id'] === userId);
    const balance = (balanceRow?.['balance'] as number) ?? 0;

    if (balance + amount < 0) {
      return { data: null, error: { message: 'insufficient_points' } };
    }

    if (balanceRow) {
      balanceRow['balance'] = balance + amount;
    } else {
      client.rowsOf(Tables.POINT_BALANCES).push({ id: 'pb-new', user_id: userId, balance: amount });
    }

    const transaction: Row = {
      id: `tx-${client.rowsOf(Tables.POINTS_TRANSACTIONS).length + 1}`,
      user_id: userId,
      amount,
      type: args['p_type'],
      reference_type: args['p_reference_type'],
      reference_id: args['p_reference_id'],
      description: args['p_description'],
      created_at: new Date().toISOString(),
    };
    client.rowsOf(Tables.POINTS_TRANSACTIONS).push(transaction);
    return { data: transaction, error: null };
  });

  client.rpcHandlers.set(RpcFunctions.CREATE_COMPANY_WITH_OWNER, (args): QueryResult<Row> => {
    const slug = args['p_slug'] as string;
    if (client.rowsOf(Tables.COMPANIES).some((row) => row['slug'] === slug)) {
      return { data: null, error: { message: 'slug_taken', code: '23505' } };
    }

    const company: Row = {
      id: `company-${client.rowsOf(Tables.COMPANIES).length + 1}`,
      name: args['p_name'],
      slug,
      description: args['p_description'],
      website: args['p_website'],
      industry: args['p_industry'],
      location: args['p_location'],
      logo_url: args['p_logo_url'],
      cover_url: args['p_cover_url'],
      status: CompanyStatus.Active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    client.rowsOf(Tables.COMPANIES).push(company);
    client.rowsOf(Tables.COMPANY_MEMBERS).push({
      id: `cm-${client.rowsOf(Tables.COMPANY_MEMBERS).length + 1}`,
      company_id: company['id'],
      user_id: args['p_owner_profile_id'],
      role: CompanyRole.Admin,
    });

    return { data: company, error: null };
  });
}

export interface TestContext {
  app: INestApplication;
  supabase: FakeSupabaseClient;
}

/** Boots the real application with the fake Supabase client injected. */
export async function createTestApp(): Promise<TestContext> {
  const supabase = buildFakeSupabase();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseService)
    .useValue({
      admin: supabase,
      anon: supabase,
      forUser: () => supabase,
      onModuleInit: () => undefined,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors) => new ValidationException(errors),
    }),
  );
  await app.init();

  return { app, supabase };
}

export const apiPath = (path: string): string => `/${API_PREFIX}${path}`;
