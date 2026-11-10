import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { InMemoryMemberAuthProvider, MEMBER_AUTH_PROVIDER } from '../../../src/modules/identity';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { APP_PREFIX, appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';

/** contracts/app /me/notifications*: the member's in-app feed (Phase 3b). */
describe('Notification feed (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let provider: InMemoryMemberAuthProvider;
  let dispatcher: OutboxDispatcher;
  let sara: RegisteredAccount;
  let omar: RegisteredAccount;

  const insertNotification = async (userId: string, minutesAgo: number) =>
    (
      await admin.query(
        `INSERT INTO app.notifications (id, recipient_user_id, type, source_event_id, target_type, target_id, created_at)
         VALUES (gen_random_uuid(), $1::uuid, 'account.password_changed', gen_random_uuid(), 'PROFILE', $1::text,
                 now() - make_interval(mins => $2::int)) RETURNING id`,
        [userId, minutesAgo],
      )
    ).rows[0].id as string;

  beforeAll(async () => {
    ({ app } = await bootApp());
    provider = app.get(MEMBER_AUTH_PROVIDER, { strict: false });
    dispatcher = app.get(OutboxDispatcher);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    provider.clear();
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani' });
    omar = await registerAccount(app, { name: 'Omar Haddad' });
  });

  it('shows the security alert from a password reset, in the request language', async () => {
    const http = () => request(app.getHttpServer());
    await http().post(`${APP_PREFIX}/auth/forgot-password`).send({ email: sara.email });
    const { token } = provider.sentResetLinks.at(-1)!;
    expect(
      (await http().post(`${APP_PREFIX}/auth/reset-password`).send({ token, password: 'new-password-1' })).status,
    ).toBe(204);
    await dispatcher.dispatchOnce();
    const login = await http().post(`${APP_PREFIX}/auth/login`).send({ email: sara.email, password: 'new-password-1' });
    const fresh = { token: login.body.data.access_token as string };

    const res = await appRequest(app, 'get', '/me/notifications', fresh, 'ar');
    expect(res.status).toBe(200);
    expect(contractErrors('app', 'get', '/me/notifications', 200, res.body)).toEqual([]);
    expect(res.body.data).toEqual([
      {
        id: expect.any(String),
        category: 'CREDENTIALS',
        title: 'تم تغيير كلمة المرور',
        body: expect.stringContaining('Back of House'),
        created_at: expect.any(String),
        target_type: 'PROFILE',
        target_id: sara.userId,
        source: 'Back of House',
        points_delta: null,
        read: false,
        application_update: null,
      },
    ]);
    expect(res.body.meta).toEqual({ page: 1, page_size: 20, has_more: false });
  });

  it('pages newest first and marks one or all read', async () => {
    const older = await insertNotification(sara.userId, 30);
    const newer = await insertNotification(sara.userId, 5);
    const third = await insertNotification(sara.userId, 60);
    await insertNotification(omar.userId, 1);

    const page1 = await appRequest(app, 'get', '/me/notifications?page=1&page_size=2', sara);
    expect(page1.body.data.map((n: { id: string }) => n.id)).toEqual([newer, older]);
    expect(page1.body.meta.has_more).toBe(true);
    const page2 = await appRequest(app, 'get', '/me/notifications?page=2&page_size=2', sara);
    expect(page2.body.data.map((n: { id: string }) => n.id)).toEqual([third]);

    expect((await appRequest(app, 'post', `/me/notifications/${older}/read`, sara)).status).toBe(204);
    expect((await appRequest(app, 'post', `/me/notifications/${older}/read`, sara)).status).toBe(204);
    const afterOne = await appRequest(app, 'get', '/me/notifications', sara);
    expect(afterOne.body.data.map((n: { read: boolean }) => n.read)).toEqual([false, true, false]);

    expect((await appRequest(app, 'post', '/me/notifications/read-all', sara)).status).toBe(204);
    const afterAll_ = await appRequest(app, 'get', '/me/notifications', sara);
    expect(afterAll_.body.data.every((n: { read: boolean }) => n.read)).toBe(true);
    const omars = await appRequest(app, 'get', '/me/notifications', omar);
    expect(omars.body.data.map((n: { read: boolean }) => n.read)).toEqual([false]);
  });

  it("answers 404 for another member's notification and leaves it unread", async () => {
    const omarsId = await insertNotification(omar.userId, 1);
    const res = await appRequest(app, 'post', `/me/notifications/${omarsId}/read`, sara);
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 404, code: 'NOT_FOUND' });
    expect((await appRequest(app, 'post', '/me/notifications/not-an-id/read', sara)).status).toBe(404);
    const { rows } = await admin.query(`SELECT read_at FROM app.notifications WHERE id = $1`, [omarsId]);
    expect(rows).toEqual([{ read_at: null }]);
  });

  it('is for individuals only', async () => {
    const company = await registerAccount(app, { name: 'Owner', company: { name: 'Echo', company_type: 'OTHER' } });
    const res = await appRequest(app, 'get', '/me/notifications', company);
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
  });
});
