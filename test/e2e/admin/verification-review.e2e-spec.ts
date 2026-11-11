import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { InMemoryStorageAdapter, STORAGE_PORT } from '../../../src/platform/storage';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';
const PDF = Buffer.from('%PDF-1.7\n%%EOF\n');

/**
 * Phase 4A: the verification review cycle over HTTP, with every admin body checked against
 * contracts/admin. A member becomes verified only by approval, and stops being verified
 * only by removal.
 */
describe('Verification review (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let storage: InMemoryStorageAdapter;
  let dispatcher: OutboxDispatcher;
  let sara: RegisteredAccount;
  let omar: RegisteredAccount;

  const staff = (method: 'get' | 'post', path: string, role = 'REVIEWER') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const expectAdmin = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('admin', method, path, status, res.body)).toEqual([]);
  };

  const submit = async (account: RegisteredAccount) => {
    for (const document of ['IDENTITY', 'EXPERIENCE']) {
      await appRequest(app, 'post', '/me/verification/documents', account)
        .field('document', document)
        .attach('file', PDF, `${document.toLowerCase()}.pdf`);
    }
    expect((await appRequest(app, 'post', '/me/verification/submit', account)).status).toBe(200);
  };

  const requestIdOf = async (account: RegisteredAccount) =>
    (await admin.query(`SELECT id FROM app.verification_requests WHERE user_id = $1`, [account.userId])).rows[0]
      .id as string;

  const isVerified = async (account: RegisteredAccount) => {
    const me = await appRequest(app, 'get', '/me', account);
    const profile = await appRequest(app, 'get', '/me/profile', account);
    return {
      me: me.body.data.is_verified,
      profile: profile.body.data.verified,
      level: profile.body.data.verification_level,
    };
  };

  beforeAll(async () => {
    ({ app } = await bootApp({ testStaff: true }));
    storage = app.get(STORAGE_PORT, { strict: false });
    dispatcher = app.get(OutboxDispatcher);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    storage.clear();
    await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES ($1, 'rv@backofhouse.test', 'Reem Reviewer', 'REVIEWER', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani', profileStatus: 'STUDENT' });
    omar = await registerAccount(app, { name: 'Omar Haddad' });
  });

  it('lists submitted requests by deadline and shows one with audited document links', async () => {
    await submit(sara);
    const list = await staff('get', '/verification-requests?status=PENDING');
    expectAdmin(list, 'get', '/verification-requests', 200);
    expect(list.body.meta).toEqual({ page: 1, page_size: 20, total: 1, total_pages: 1 });
    expect(list.body.data[0]).toMatchObject({
      subject_type: 'USER',
      subject: { id: sara.userId, name: 'Sara Al-Qahtani', kind: 'STUDENT' },
      status: 'PENDING',
      due_at: expect.any(String),
      documents: [],
    });

    const id = await requestIdOf(sara);
    const detail = await staff('get', `/verification-requests/${id}`);
    expectAdmin(detail, 'get', '/verification-requests/{id}', 200);
    expect(detail.body.data.documents.map((d: { kind: string }) => d.kind)).toEqual(['EXPERIENCE', 'IDENTITY']);
    expect(detail.body.data.documents[0].upload).toMatchObject({
      purpose: 'VERIFICATION_DOC',
      mime: 'application/pdf',
    });
    const { rows } = await admin.query(
      `SELECT count(*)::int AS n FROM app.audit_logs WHERE action = 'verification.view_document'`,
    );
    expect(rows[0].n).toBe(2);

    expect((await staff('get', '/verification-requests?status=APPROVED')).body.data).toEqual([]);
    expect((await staff('get', '/verification-requests?subject_type=COMPANY')).body.data).toEqual([]);
  });

  it('asks for more information, takes a resubmission, approves, then removes verification', async () => {
    await submit(sara);
    const id = await requestIdOf(sara);

    const info = await staff('post', `/verification-requests/${id}/request-info`).send({
      message: 'Upload a clearer ID.',
    });
    expectAdmin(info, 'post', '/verification-requests/{id}/request-info', 200);
    expect(info.body.data).toMatchObject({
      status: 'MORE_INFO',
      decision_note: 'Upload a clearer ID.',
      decided_by: 'Reem Reviewer',
    });
    expect((await appRequest(app, 'get', '/me/verification', sara)).body.data.status).toBe('DRAFT');

    await dispatcher.dispatchOnce();
    const feed = await appRequest(app, 'get', '/me/notifications', sara);
    expect(feed.body.data[0]).toMatchObject({
      title: 'More information needed',
      body: expect.stringContaining('Upload a clearer ID.'),
    });

    await submit(sara);
    expect((await staff('get', `/verification-requests/${id}`)).body.data.status).toBe('PENDING');
    expect(await isVerified(sara)).toEqual({ me: false, profile: false, level: 0 });

    const approved = await staff('post', `/verification-requests/${id}/approve`).send({ note: 'Looks good' });
    expectAdmin(approved, 'post', '/verification-requests/{id}/approve', 200);
    expect(approved.body.data.status).toBe('APPROVED');
    expect(await isVerified(sara)).toEqual({ me: true, profile: true, level: 1 });
    expect((await appRequest(app, 'get', '/professionals', omar)).body.data[0]).toMatchObject({
      name: 'Sara Al-Qahtani',
      verified: true,
    });

    const again = await staff('post', `/verification-requests/${id}/approve`).send({});
    expect({ status: again.status, code: again.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });
    const late = await appRequest(app, 'post', '/me/verification/documents', sara)
      .field('document', 'IDENTITY')
      .attach('file', PDF, 'x.pdf');
    expect(late.body.code).toBe('VERIFICATION_LOCKED');

    const removed = await staff('post', `/users/${sara.userId}/verification/remove`).send({
      reason: 'Document expired',
    });
    expectAdmin(removed, 'post', '/users/{id}/verification/remove', 200);
    expect(removed.body.data.user.verification).toBe('REJECTED');
    expect(await isVerified(sara)).toEqual({ me: false, profile: false, level: 0 });

    const twice = await staff('post', `/users/${sara.userId}/verification/remove`).send({ reason: 'again' });
    expect({ status: twice.status, code: twice.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });
    const { rows } = await admin.query(`SELECT action::text FROM app.verification_decisions ORDER BY decided_at, id`);
    expect(rows.map((r) => r.action)).toEqual(['REQUEST_INFO', 'APPROVE', 'REMOVE']);
  });

  it('rejects with a message the member sees, and lets them try again', async () => {
    await submit(omar);
    const id = await requestIdOf(omar);
    const missing = await staff('post', `/verification-requests/${id}/reject`).send({});
    expect(missing.body.errors).toEqual({ message: ['is required'] });

    const rejected = await staff('post', `/verification-requests/${id}/reject`).send({
      message: 'The certificate is not readable.',
    });
    expect(rejected.body.data.status).toBe('REJECTED');
    await dispatcher.dispatchOnce();
    const feed = await appRequest(app, 'get', '/me/notifications', omar, 'ar');
    expect(feed.body.data[0]).toMatchObject({ title: 'لم تتم الموافقة على التوثيق' });

    await submit(omar);
    expect((await staff('get', `/verification-requests/${id}`)).body.data.status).toBe('PENDING');
  });

  it('never shows a DRAFT to staff and answers 404 for unknown ids', async () => {
    await appRequest(app, 'post', '/me/verification/documents', sara)
      .field('document', 'IDENTITY')
      .attach('file', PDF, 'id.pdf');
    const id = await requestIdOf(sara);
    expect((await staff('get', `/verification-requests/${id}`)).status).toBe(404);
    expect((await staff('get', '/verification-requests')).body.data).toEqual([]);
    expect((await staff('post', `/verification-requests/not-an-id/approve`).send({})).status).toBe(404);
  });
});
