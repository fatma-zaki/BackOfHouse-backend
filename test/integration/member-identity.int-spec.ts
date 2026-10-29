import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { CLOCK } from '../../src/common/clock/clock';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { ClockModule } from '../../src/platform/clock/clock.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import {
  ActivityService,
  IdentityModule,
  MemberAuthService,
  MembersService,
  PHONE_CODE,
  PhoneSignInService,
} from '../../src/modules/identity';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { FakeClock } from '../support/fake-staff-idp';

const HOUR = 3600_000;

describe('Member identity (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let clock: FakeClock;
  let auth: MemberAuthService;
  let phone: PhoneSignInService;
  let activity: ActivityService;
  let members: MembersService;

  const register = (email: string, phoneNumber: string) =>
    auth.register({
      full_name: 'Test Member',
      email,
      phone: phoneNumber,
      password: 'password-1',
      account_type: 'INDIVIDUAL',
    });

  beforeAll(async () => {
    applyTestEnv();
    clock = new FakeClock();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, ClockModule, DatabaseModule, AuditModule, IdentityModule],
    })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    await moduleRef.init();
    auth = moduleRef.get(MemberAuthService);
    phone = moduleRef.get(PhoneSignInService);
    activity = moduleRef.get(ActivityService);
    members = moduleRef.get(MembersService);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    clock.advance(2 * HOUR);
  });

  describe('activity tracking', () => {
    it('writes one row for 100 requests by one user on one Riyadh day, and a new row the next day', async () => {
      const { userId } = await register('a@example.com', '+966500000001');
      for (let i = 0; i < 100; i += 1) await activity.touch(userId);
      const days = async () =>
        (await admin.query(`SELECT day::text FROM app.user_activity_days WHERE user_id = $1 ORDER BY day`, [userId]))
          .rows;
      expect(await days()).toHaveLength(1);

      clock.advance(24 * HOUR);
      await activity.touch(userId);
      expect(await days()).toHaveLength(2);
    });

    it('updates last_active_at at most hourly', async () => {
      const { userId } = await register('b@example.com', '+966500000002');
      const lastActive = async () =>
        (await admin.query(`SELECT last_active_at FROM app.users WHERE id = $1`, [userId])).rows[0].last_active_at;
      await activity.touch(userId);
      const first = await lastActive();
      clock.advance(10 * 60_000);
      await activity.touch(userId);
      expect(await lastActive()).toEqual(first);
      clock.advance(HOUR);
      await activity.touch(userId);
      expect((await lastActive()).getTime()).toBeGreaterThan(first.getTime());
    });
  });

  describe('phone codes', () => {
    it('caps codes requested from one IP per hour, across numbers', async () => {
      const ip = '203.0.113.7';
      for (let i = 0; i < PHONE_CODE.maxPerIpPerHour; i += 1) {
        await phone.sendCode({ phone: `+9665100000${String(i).padStart(2, '0')}` }, { ip, locale: 'en' });
      }
      await expect(phone.sendCode({ phone: '+966510000099' }, { ip, locale: 'en' })).rejects.toMatchObject({
        code: 'RATE_LIMITED',
      });
      await expect(
        phone.sendCode({ phone: '+966510000099' }, { ip: '203.0.113.8', locale: 'en' }),
      ).resolves.toBeUndefined();
      clock.advance(HOUR);
      await expect(phone.sendCode({ phone: '+966510000098' }, { ip, locale: 'en' })).resolves.toBeUndefined();
    });

    it('stores rows without a code for numbers without an account (the CHECK holds)', async () => {
      await phone.sendCode({ phone: '+966520000000' }, { ip: '203.0.113.9', locale: 'en' });
      const { rows } = await admin.query(`SELECT user_id, code_hash FROM app.phone_sign_in_codes`);
      expect(rows).toEqual([{ user_id: null, code_hash: null }]);
    });
  });

  it('purges day-old codes and revocations whose tokens expired', async () => {
    const { userId } = await register('c@example.com', '+966500000003');
    await phone.sendCode({ phone: '+966500000003' }, { ip: '203.0.113.10', locale: 'en' });
    await admin.query(
      `INSERT INTO app.revoked_member_sessions (session_id, user_id, expires_at) VALUES ('s1', $1, $2)`,
      [userId, new Date(clock.now().getTime() + 600_000)],
    );
    expect(await members.purge()).toEqual({ codes: 0, sessions: 0 });
    clock.advance(25 * HOUR);
    expect(await members.purge()).toEqual({ codes: 1, sessions: 1 });
  });

  it('enforces the schema rules for users', async () => {
    const insert = (sql: string) => admin.query(sql);
    const base = `INSERT INTO app.users (id, account_type, full_name, email, phone, profile_status, updated_at)`;
    await expect(
      insert(`${base} VALUES (gen_random_uuid(), 'COMPANY', 'X', 'x@example.com', NULL, 'STUDENT', now())`),
    ).rejects.toThrow(/ck_users__profile_status_individual_only/);
    await expect(
      insert(`${base} VALUES (gen_random_uuid(), 'INDIVIDUAL', 'X', 'x@example.com', NULL, NULL, now())`),
    ).rejects.toThrow(/ck_users__profile_status_individual_only/);
    await expect(
      insert(`${base} VALUES (gen_random_uuid(), 'INDIVIDUAL', 'X', 'X@example.com', NULL, 'STUDENT', now())`),
    ).rejects.toThrow(/ck_users__email_lowercase/);
    await expect(
      insert(`${base} VALUES (gen_random_uuid(), 'INDIVIDUAL', 'X', 'x@example.com', '0501234567', 'STUDENT', now())`),
    ).rejects.toThrow(/ck_users__phone_e164/);
  });
});
