import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { SettingsModule, SettingsService, defaultSettings, PlatformSettings } from '../../src/modules/settings';
import { ForbiddenError, ValidationFailedError } from '../../src/common/errors';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { memberActor, staffActor, TEST_STAFF_ID } from '../support/test-actors';

describe('SettingsService (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let settings: SettingsService;
  let defaults: PlatformSettings;

  beforeAll(async () => {
    applyTestEnv({ APP_IOS_MIN_SUPPORTED_VERSION: '1.0.0', APP_IOS_LATEST_VERSION: '1.3.0' });
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, AuditModule, SettingsModule],
    }).compile();
    await moduleRef.init();
    settings = moduleRef.get(SettingsService);
    admin = await connectAdmin();
    defaults = await settings.current();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  it('serves code defaults, with app-version defaults from the environment', async () => {
    const current = await settings.current();
    expect(current).toEqual(
      defaultSettings({
        ios: { min_supported_version: '1.0.0', latest_version: '1.3.0', update_url: 'https://apps.apple.com/' },
        android: {
          min_supported_version: '1.0.0',
          latest_version: '1.0.0',
          update_url: 'https://play.google.com/store/apps',
        },
      }),
    );
  });

  it('stores only changed keys and audits the change in the same transaction', async () => {
    const next = { ...defaults, review_sla_hours: 12, push_quiet_hours: { start: '22:00', end: '07:00' } };
    await expect(settings.update(staffActor('SUPER_ADMIN'), next)).resolves.toEqual(next);

    const rows = await admin.query('SELECT key, value, updated_by_staff_id FROM app.platform_settings ORDER BY key');
    expect(rows.rows).toEqual([
      { key: 'push_quiet_hours', value: { start: '22:00', end: '07:00' }, updated_by_staff_id: TEST_STAFF_ID },
      { key: 'review_sla_hours', value: 12, updated_by_staff_id: TEST_STAFF_ID },
    ]);
    const audit = await admin.query(
      `SELECT actor_type, actor_user_id, actor_platform_roles, action, changes FROM app.audit_logs`,
    );
    expect(audit.rows).toEqual([
      {
        actor_type: 'STAFF',
        actor_user_id: TEST_STAFF_ID,
        actor_platform_roles: ['SUPER_ADMIN'],
        action: 'settings.update',
        changes: {
          before: { review_sla_hours: 24, push_quiet_hours: { start: '23:00', end: '08:00' } },
          after: { review_sla_hours: 12, push_quiet_hours: { start: '22:00', end: '07:00' } },
        },
      },
    ]);
    expect((await settings.current()).review_sla_hours).toBe(12);
  });

  describe('policy holds when the service is called directly (actor bypass, execution-plan.md §1.4)', () => {
    it.each([
      ['a member', memberActor()],
      ['a Reviewer', staffActor('REVIEWER')],
      ['an Analyst', staffActor('ANALYST')],
      ['no actor', undefined],
    ])('refuses %s', async (_label, actor) => {
      await expect(settings.update(actor, { ...defaults, review_sla_hours: 1 })).rejects.toBeInstanceOf(ForbiddenError);
      await expect(settings.getForStaff(actor)).rejects.toBeInstanceOf(ForbiddenError);
      expect((await admin.query('SELECT count(*)::int AS n FROM app.platform_settings')).rows[0].n).toBe(0);
    });
  });

  it('rejects invalid settings with field errors and writes nothing', async () => {
    const error = await settings
      .update(staffActor('SUPER_ADMIN'), { ...defaults, verified_companies_skip_review: true, review_sla_hours: 0 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationFailedError);
    expect((error as ValidationFailedError).errors).toEqual({
      review_sla_hours: [expect.any(String)],
      verified_companies_skip_review: ['verified companies do not skip review (D9)'],
    });
    expect((await admin.query('SELECT count(*)::int AS n FROM app.audit_logs')).rows[0].n).toBe(0);
  });

  it('falls back to the default when a stored value no longer validates', async () => {
    await admin.query(
      `INSERT INTO app.platform_settings (key, value, updated_at) VALUES ('review_sla_hours', '"not a number"', now())`,
    );
    expect((await settings.current()).review_sla_hours).toBe(24);
  });
});
