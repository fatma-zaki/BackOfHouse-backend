import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { CLOCK } from '../../src/common/clock/clock';
import { RequestContext } from '../../src/common/context/request-context';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { ClockModule } from '../../src/platform/clock/clock.module';
import { OutboxDispatcher, OutboxHandlerRegistry, OutboxModule } from '../../src/platform/outbox';
import { JobsService } from '../../src/platform/jobs/jobs.service';
import { WorkerModule } from '../../src/worker.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import {
  IdentityModule,
  InMemoryMemberAuthProvider,
  MEMBER_AUTH_PROVIDER,
  MemberAuthService,
} from '../../src/modules/identity';
import {
  DeliveryService,
  DevEmailSender,
  DevicesService,
  EMAIL_SENDER,
  FakePushSender,
  NotificationsModule,
  PreferencesService,
  PUSH_SENDER,
} from '../../src/modules/notifications';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { FakeClock } from '../support/fake-staff-idp';

describe('Notification delivery (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let clock: FakeClock;
  let auth: MemberAuthService;
  let provider: InMemoryMemberAuthProvider;
  let dispatcher: OutboxDispatcher;
  let delivery: DeliveryService;
  let devices: DevicesService;
  let preferences: PreferencesService;
  let push: FakePushSender;
  let email: DevEmailSender;

  /** Registers a member (in `locale`) and resets their password, which emits `user.password.changed`. */
  const memberChangesPassword = async (locale: 'en' | 'ar', withDevice = true) => {
    const tokens = await RequestContext.run({ requestId: 'test', locale }, () =>
      auth.register({
        full_name: 'Sara Ali',
        email: `sara.${locale}@example.com`,
        phone: locale === 'ar' ? '+966500000011' : '+966500000012',
        password: 'password-1',
        account_type: 'INDIVIDUAL',
      }),
    );
    if (withDevice) await devices.register(tokens.userId, { token: `fcm-${locale}`, platform: 'ANDROID' });
    await provider.sendPasswordReset(`sara.${locale}@example.com`);
    const link = provider.sentResetLinks.at(-1)!;
    await RequestContext.run({ requestId: 'test', locale }, () =>
      auth.resetPassword({ token: link.token, password: 'password-2' }),
    );
    return tokens.userId;
  };

  const passwordEvents = async () =>
    (await admin.query(`SELECT id, status FROM app.outbox_events WHERE event_name = 'user.password.changed'`)).rows;

  beforeAll(async () => {
    applyTestEnv();
    clock = new FakeClock();
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        ClockModule,
        DatabaseModule,
        OutboxModule,
        AuditModule,
        IdentityModule,
        NotificationsModule,
      ],
    })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    await moduleRef.init();
    auth = moduleRef.get(MemberAuthService);
    provider = moduleRef.get(MEMBER_AUTH_PROVIDER);
    dispatcher = moduleRef.get(OutboxDispatcher);
    delivery = moduleRef.get(DeliveryService);
    devices = moduleRef.get(DevicesService);
    preferences = moduleRef.get(PreferencesService);
    push = moduleRef.get(PUSH_SENDER);
    email = moduleRef.get(EMAIL_SENDER);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    provider.clear();
    push.clear();
    email.clear();
    clock.advance(3600_000);
  });

  it('turns one event into one in-app row, one FCM call and one email, in the recipient language', async () => {
    const userId = await memberChangesPassword('ar');
    expect(await dispatcher.dispatchOnce()).toMatchObject({ processed: expect.any(Number), failed: 0, retried: 0 });

    const { rows } = await admin.query(`SELECT id, type, target_type, target_id, read_at FROM app.notifications`);
    expect(rows).toEqual([
      {
        id: expect.any(String),
        type: 'account.password_changed',
        target_type: 'PROFILE',
        target_id: userId,
        read_at: null,
      },
    ]);
    expect(push.calls).toHaveLength(1);
    expect(push.calls[0]).toMatchObject({
      tokens: ['fcm-ar'],
      title: 'تم تغيير كلمة المرور',
      data: { notification_id: rows[0].id, type: 'account.password_changed', target_type: 'PROFILE' },
    });
    expect(email.sent).toEqual([
      expect.objectContaining({
        to: 'sara.ar@example.com',
        locale: 'ar',
        subject: 'تم تغيير كلمة مرور حسابك في Back of House',
      }),
    ]);
    expect(email.sent[0].text).toContain('مرحبًا Sara Ali،');

    const deliveries = await admin.query(
      `SELECT channel, status, destination_masked, attempts FROM app.notification_deliveries ORDER BY channel`,
    );
    expect(deliveries.rows).toEqual([
      { channel: 'PUSH', status: 'SENT', destination_masked: '1 of 1 device(s)', attempts: 1 },
      { channel: 'EMAIL', status: 'SENT', destination_masked: 's***@example.com', attempts: 1 },
    ]);
  });

  it('writes English for a member who signed up in English', async () => {
    await memberChangesPassword('en');
    await dispatcher.dispatchOnce();
    expect(push.calls[0].title).toBe('Your password was changed');
    expect(email.sent[0].text).toContain('Hello Sara Ali,');
  });

  it('notifies once when the same event is delivered twice', async () => {
    await memberChangesPassword('en');
    await dispatcher.dispatchOnce();
    const [event] = await passwordEvents();
    await admin.query(
      `UPDATE app.outbox_events SET status = 'PENDING', available_at = now() - interval '1 second' WHERE id = $1`,
      [event.id],
    );
    await dispatcher.dispatchOnce();

    expect((await passwordEvents())[0].status).toBe('PROCESSED');
    expect((await admin.query(`SELECT count(*)::int AS n FROM app.notifications`)).rows[0].n).toBe(1);
    expect((await admin.query(`SELECT count(*)::int AS n FROM app.notification_deliveries`)).rows[0].n).toBe(2);
    expect(push.calls).toHaveLength(1);
    expect(email.sent).toHaveLength(1);
  });

  it('skips push for a member without devices and still emails', async () => {
    await memberChangesPassword('en', false);
    await dispatcher.dispatchOnce();
    const { rows } = await admin.query(
      `SELECT channel, status, last_error FROM app.notification_deliveries ORDER BY channel`,
    );
    expect(rows).toEqual([
      { channel: 'PUSH', status: 'SKIPPED', last_error: 'no registered devices' },
      { channel: 'EMAIL', status: 'SENT', last_error: null },
    ]);
    expect(push.calls).toHaveLength(0);
  });

  it('drops tokens FCM reports as unregistered', async () => {
    push.unregistered.add('fcm-en');
    await memberChangesPassword('en');
    await dispatcher.dispatchOnce();
    expect((await admin.query(`SELECT count(*)::int AS n FROM app.member_devices`)).rows[0].n).toBe(0);
    expect(
      (await admin.query(`SELECT status FROM app.notification_deliveries WHERE channel = 'PUSH'`)).rows[0].status,
    ).toBe('SKIPPED');
  });

  it('retries a failed send with backoff from the deliver job', async () => {
    const send = jest.spyOn(email, 'send').mockRejectedValueOnce(new Error('provider down'));
    await memberChangesPassword('en');
    await dispatcher.dispatchOnce();
    const row = async () =>
      (
        await admin.query(
          `SELECT status, attempts, last_error FROM app.notification_deliveries WHERE channel = 'EMAIL'`,
        )
      ).rows[0];
    expect(await row()).toEqual({ status: 'QUEUED', attempts: 1, last_error: 'provider down' });

    expect((await delivery.deliverDue()).claimed).toBe(0);
    clock.advance(31_000);
    expect(await delivery.deliverDue()).toMatchObject({ claimed: 1, sent: 1 });
    expect(await row()).toEqual({ status: 'SENT', attempts: 2, last_error: null });
    send.mockRestore();
  });

  it('moves a device token to the member who signs in on that phone', async () => {
    const first = await memberChangesPassword('en');
    const second = await memberChangesPassword('ar', false);
    await devices.register(second, { token: 'fcm-en', platform: 'IOS' });
    const { rows } = await admin.query(`SELECT user_id, platform FROM app.member_devices`);
    expect(rows).toEqual([{ user_id: second, platform: 'IOS' }]);
    expect(first).not.toBe(second);
  });

  it('refuses to turn off a security notification', async () => {
    const userId = await memberChangesPassword('en', false);
    await expect(preferences.set(userId, 'account.password_changed', 'EMAIL', false)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(await preferences.list(userId)).toEqual([
      { type: 'account.password_changed', channel: 'PUSH', enabled: true, mandatory: true },
      { type: 'account.password_changed', channel: 'EMAIL', enabled: true, mandatory: true },
    ]);
  });
});

describe('Worker process wiring', () => {
  it('registers the notification handlers and the identity and notification jobs', async () => {
    applyTestEnv({ JOBS_ENABLED: 'false' });
    const moduleRef = await Test.createTestingModule({ imports: [WorkerModule] }).compile();
    await moduleRef.init();
    try {
      const registry = moduleRef.get(OutboxHandlerRegistry);
      expect(registry.handlersFor('user.password.changed').map((h) => h.name)).toEqual([
        'AccountEventsHandler.passwordChanged',
      ]);
      const jobs = moduleRef.get(JobsService) as unknown as { definitions: Map<string, unknown> };
      expect([...jobs.definitions.keys()]).toEqual(expect.arrayContaining(['identity.purge', 'notifications.deliver']));
    } finally {
      await moduleRef.close();
    }
  });
});
