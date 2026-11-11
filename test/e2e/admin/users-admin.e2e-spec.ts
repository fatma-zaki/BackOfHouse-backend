import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { InMemoryMemberAuthProvider, MEMBER_AUTH_PROVIDER } from '../../../src/modules/identity';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';

/** Phase 4A: the users table, user detail, account actions and internal notes. */
describe('Users and notes in the back office (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let provider: InMemoryMemberAuthProvider;
  let dispatcher: OutboxDispatcher;
  let sara: RegisteredAccount;
  let nora: RegisteredAccount;
  let company: RegisteredAccount;

  const staff = (method: 'get' | 'post', path: string, role = 'SUPER_ADMIN') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const expectAdmin = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('admin', method, path, status, res.body)).toEqual([]);
  };

  beforeAll(async () => {
    ({ app } = await bootApp({ testStaff: true }));
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
    await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES ($1, 'sa@backofhouse.test', 'Sami Admin', 'SUPER_ADMIN', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani' });
    nora = await registerAccount(app, { name: 'نورة السبيعي', profileStatus: 'STUDENT' });
    company = await registerAccount(app, {
      name: 'Faisal Owner',
      company: { name: 'Stagecraft', company_type: 'VENUE' },
    });
    await appRequest(app, 'patch', '/me/profile', sara).send({
      name: 'Sara Al-Qahtani',
      headline: '',
      city: 'Jeddah',
      about: '',
      profile_status: 'PROFESSIONAL',
      interests: [],
      contact_privacy: {},
    });
  });

  describe('users table', () => {
    it('lists with counts, masked email and filters', async () => {
      const all = await staff('get', '/users?sort=full_name');
      expectAdmin(all, 'get', '/users', 200);
      expect(all.body.counts).toEqual({ all: 3, individuals: 2, companies: 1, suspended: 0 });
      expect(all.body.meta).toEqual({ page: 1, page_size: 20, total: 3, total_pages: 1 });
      const saraRow = all.body.data.find((r: { id: string }) => r.id === sara.userId);
      expect(saraRow).toMatchObject({ type: 'INDIVIDUAL', city: 'Jeddah', verification: 'NONE', status: 'ACTIVE' });
      expect(saraRow.email_masked).not.toBe(sara.email);
      expect(JSON.stringify(all.body)).not.toContain(sara.email);

      const names = async (query: string) =>
        (await staff('get', `/users?${query}`)).body.data.map((r: { full_name: string }) => r.full_name);
      expect(await names('type=STUDENT')).toEqual(['نورة السبيعي']);
      expect(await names('type=COMPANY')).toEqual(['Faisal Owner']);
      expect(await names('city=jeddah')).toEqual(['Sara Al-Qahtani']);
      expect(await names(`q=${encodeURIComponent('نوره')}`)).toEqual(['نورة السبيعي']);
      expect(await names('verified=true')).toEqual([]);
      expect(await names('joined_from=2030-01-01')).toEqual([]);
      expect((await staff('get', '/users?sort=email')).status).toBe(422);
    });

    it('shows contact details only to roles allowed to see them, and audits it', async () => {
      const full = await staff('get', `/users/${sara.userId}`);
      expectAdmin(full, 'get', '/users/{id}', 200);
      expect(full.body.data).toMatchObject({ email: sara.email, phone: sara.phone });
      expect(full.body.data.allowed_actions).toEqual(['RESET_PASSWORD', 'SUSPEND']);

      const reviewer = await staff('get', `/users/${sara.userId}`, 'REVIEWER');
      expect(reviewer.body.data).toMatchObject({ email: null, phone: null, allowed_actions: [] });
      const { rows } = await admin.query(
        `SELECT count(*)::int AS n FROM app.audit_logs WHERE action = 'user.contact.view'`,
      );
      expect(rows[0].n).toBe(1);
    });
  });

  describe('account actions', () => {
    it('suspends (ending sessions at once) and reinstates', async () => {
      expect((await appRequest(app, 'get', '/me', sara)).status).toBe(200);
      const suspended = await staff('post', `/users/${sara.userId}/suspend`).send({ reason: 'Spam reports' });
      expectAdmin(suspended, 'post', '/users/{id}/suspend', 200);
      expect(suspended.body.data.user.status).toBe('SUSPENDED');
      expect(suspended.body.data.allowed_actions).toContain('UNSUSPEND');
      expect((await appRequest(app, 'get', '/me', sara)).status).toBe(401);
      expect((await staff('post', `/users/${sara.userId}/suspend`).send({ reason: 'again' })).body.code).toBe(
        'INVALID_TRANSITION',
      );
      expect((await staff('post', `/users/${sara.userId}/suspend`).send({})).body.errors).toEqual({
        reason: ['is required'],
      });

      const back = await staff('post', `/users/${sara.userId}/unsuspend`);
      expectAdmin(back, 'post', '/users/{id}/unsuspend', 200);
      expect(back.body.data.user.status).toBe('ACTIVE');
      const { rows } = await admin.query(
        `SELECT event_name FROM app.outbox_events WHERE event_name IN ('user.suspended', 'user.reinstated') ORDER BY occurred_at`,
      );
      expect(rows.map((r) => r.event_name)).toEqual(['user.suspended', 'user.reinstated']);
    });

    it('sends a reset link without staff ever setting a password', async () => {
      const res = await staff('post', `/users/${sara.userId}/password-reset`, 'SUPPORT');
      expect(res.status).toBe(204);
      expect(provider.sentResetLinks.map((l) => l.email)).toEqual([sara.email]);
      expect((await staff('post', '/users/00000000-0000-7000-8000-000000000000/password-reset')).status).toBe(404);
    });

    it('runs a bulk suspension in the worker and refuses actions not built yet', async () => {
      const accepted = await staff('post', '/users/bulk').send({
        user_ids: [sara.userId, nora.userId],
        action: 'SUSPEND',
      });
      expectAdmin(accepted, 'post', '/users/bulk', 202);
      expect(accepted.body.data).toEqual({ job_id: expect.any(String), status: 'QUEUED' });
      expect((await staff('get', '/users?status=SUSPENDED')).body.data).toEqual([]);

      await dispatcher.dispatchOnce();
      const after = (await staff('get', '/users?status=SUSPENDED&sort=full_name')).body.data;
      expect(after.map((r: { id: string }) => r.id).sort()).toEqual([sara.userId, nora.userId].sort());

      const message = await staff('post', '/users/bulk').send({ user_ids: [sara.userId], action: 'MESSAGE' });
      expect({ status: message.status, errors: message.body.errors }).toEqual({
        status: 422,
        errors: { action: ['MESSAGE is not available yet'] },
      });
    });
  });

  describe('internal notes', () => {
    it('adds and lists notes on users and companies, newest first', async () => {
      const first = await staff('post', `/users/${sara.userId}/notes`, 'SUPPORT').send({
        body: 'Called about her ID.',
      });
      expectAdmin(first, 'post', '/{subject}/{id}/notes', 201);
      expect(first.body.data.author).toEqual({ id: TEST_STAFF_ID, name: 'Sami Admin' });
      await staff('post', `/users/${sara.userId}/notes`).send({ body: 'Second note.' });
      await staff('post', `/companies/${company.companyId}/notes`).send({ body: 'Venue owner.' });

      const list = await staff('get', `/users/${sara.userId}/notes`, 'REVIEWER');
      expectAdmin(list, 'get', '/{subject}/{id}/notes', 200);
      expect(list.body.data.map((n: { body: string }) => n.body)).toEqual(['Second note.', 'Called about her ID.']);
      expect((await staff('get', `/companies/${company.companyId}/notes`)).body.data).toHaveLength(1);
    });

    it('refuses unknown subjects, empty notes and edits', async () => {
      expect((await staff('get', `/teams/${sara.userId}/notes`)).status).toBe(404);
      expect((await staff('get', `/users/${company.companyId}/notes`)).status).toBe(404);
      expect((await staff('post', `/users/${sara.userId}/notes`).send({ body: '  ' })).status).toBe(422);
      await staff('post', `/users/${sara.userId}/notes`).send({ body: 'Final.' });
      await expect(admin.query(`UPDATE app.staff_notes SET body = 'changed'`)).rejects.toThrow();
    });
  });
});
