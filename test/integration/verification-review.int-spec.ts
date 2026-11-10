import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { StaffBellService } from '../../src/modules/notifications';
import { VerificationService } from '../../src/modules/verification';
import { OutboxDispatcher } from '../../src/platform/outbox';
import { InMemoryStorageAdapter, STORAGE_PORT } from '../../src/platform/storage';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { contractErrors } from '../support/contract';
import { connectAdmin, resetDatabase } from '../support/database';
import { memberActor, staffActor, TEST_STAFF_ID } from '../support/test-actors';

const PDF = Buffer.from('%PDF-1.7\n%%EOF\n');

/**
 * Exit tests of Phase 3b (execution-plan.md): the admin bell lists a new verification
 * request for Reviewer and Super admin only, and a document is reachable only through a
 * signed URL, each one audited.
 */
describe('Verification review: bell and document access (real Postgres)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let storage: InMemoryStorageAdapter;
  let dispatcher: OutboxDispatcher;
  let bell: StaffBellService;
  let verification: VerificationService;
  let sara: RegisteredAccount;

  const staff = {
    superAdmin: '0191f0a0-0000-7000-8000-00000000c001',
    reviewer: TEST_STAFF_ID,
    editor: '0191f0a0-0000-7000-8000-00000000c003',
    invitedReviewer: '0191f0a0-0000-7000-8000-00000000c004',
  };

  const addStaff = (id: string, role: string, status = 'ACTIVE') =>
    admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES ($1, $2, $3, $4::app.staff_role, $5::app.staff_status, CASE WHEN $5 = 'ACTIVE' THEN now() END, now())`,
      [id, `${id.slice(-4)}@backofhouse.test`, `Staff ${role}`, role, status],
    );

  const submitRequest = async () => {
    for (const document of ['IDENTITY', 'EXPERIENCE']) {
      await appRequest(app, 'post', '/me/verification/documents', sara)
        .field('document', document)
        .attach('file', PDF, `${document.toLowerCase()}.pdf`);
    }
    expect((await appRequest(app, 'post', '/me/verification/submit', sara)).status).toBe(200);
  };

  beforeAll(async () => {
    ({ app } = await bootApp({ testStaff: true }));
    storage = app.get(STORAGE_PORT, { strict: false });
    dispatcher = app.get(OutboxDispatcher);
    bell = app.get(StaffBellService, { strict: false });
    verification = app.get(VerificationService, { strict: false });
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    storage.clear();
    await addStaff(staff.superAdmin, 'SUPER_ADMIN');
    await addStaff(staff.reviewer, 'REVIEWER');
    await addStaff(staff.editor, 'EDITOR');
    await addStaff(staff.invitedReviewer, 'REVIEWER', 'INVITED');
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani' });
  });

  describe('admin bell', () => {
    it('shows the new request to active Reviewers and Super admins only', async () => {
      await submitRequest();
      await dispatcher.dispatchOnce();

      const items = async (id: string, role: 'SUPER_ADMIN' | 'REVIEWER' | 'EDITOR') =>
        (await bell.list(staffActor(role, id), {}, 'en')).items;
      const [forReviewer] = await items(staff.reviewer, 'REVIEWER');
      expect(forReviewer).toMatchObject({ type: 'VERIFICATION', title: 'New verification request', readAt: null });
      expect(await items(staff.superAdmin, 'SUPER_ADMIN')).toHaveLength(1);
      expect(await items(staff.editor, 'EDITOR')).toEqual([]);
      expect(await items(staff.invitedReviewer, 'REVIEWER')).toEqual([]);
      const { rows } = await admin.query(`SELECT recipient_staff_id FROM app.staff_notifications ORDER BY 1`);
      expect(rows.map((r) => r.recipient_staff_id).sort()).toEqual([staff.superAdmin, staff.reviewer].sort());
    });

    it('notifies once when the event is delivered twice', async () => {
      await submitRequest();
      await dispatcher.dispatchOnce();
      await admin.query(
        `UPDATE app.outbox_events SET status = 'PENDING', available_at = now() - interval '1 second'
         WHERE event_name = 'verification.submitted'`,
      );
      await dispatcher.dispatchOnce();
      expect((await admin.query(`SELECT count(*)::int AS n FROM app.staff_notifications`)).rows[0].n).toBe(2);
    });

    it('serves the bell over HTTP in the request language, matching the contract, with a cursor', async () => {
      await submitRequest();
      await dispatcher.dispatchOnce();
      const res = await request(app.getHttpServer())
        .get('/api/admin/v1/notifications?limit=1')
        .set('x-test-actor', 'staff:REVIEWER')
        .set('Accept-Language', 'ar');
      expect(res.status).toBe(200);
      expect(contractErrors('admin', 'get', '/notifications', 200, res.body)).toEqual([]);
      expect(res.body.data[0]).toMatchObject({ type: 'VERIFICATION', title: 'طلب توثيق جديد', read_at: null });
      expect(res.body.meta).toEqual({ next_cursor: null, has_more: false });

      const anonymous = await request(app.getHttpServer()).get('/api/admin/v1/notifications');
      expect(anonymous.status).toBe(401);
    });

    it('pages with an opaque cursor, newest first', async () => {
      const event = (id: string) => ({ event_id: id }) as never;
      for (const id of ['0191f0a0-0000-7000-8000-0000000e0001', '0191f0a0-0000-7000-8000-0000000e0002']) {
        await bell.notifyStaff(event(id), { type: 'staff.verification_submitted', payload: {} });
      }
      const first = await bell.list(staffActor('REVIEWER', staff.reviewer), { limit: 1 }, 'en');
      expect(first.items).toHaveLength(1);
      expect(first.nextCursor).toEqual(expect.any(String));
      const second = await bell.list(
        staffActor('REVIEWER', staff.reviewer),
        { limit: 1, cursor: first.nextCursor! },
        'en',
      );
      expect(second.items).toHaveLength(1);
      expect(second.items[0].id).not.toBe(first.items[0].id);
      expect(second.nextCursor).toBeNull();
    });
  });

  describe('document access', () => {
    it('hands Reviewers a short-lived signed URL and audits every one', async () => {
      await submitRequest();
      const { rows: docs } = await admin.query(`SELECT id, path FROM app.verification_documents ORDER BY document`);
      const reviewer = staffActor('REVIEWER', staff.reviewer);

      const first = await verification.documentUrl(reviewer, docs[0].id);
      await verification.documentUrl(reviewer, docs[0].id);
      expect(first).toEqual({ url: expect.stringMatching(/^memory:\/\/private-documents\//), expiresIn: 300 });
      expect(storage.issuedUrls).toHaveLength(2);

      const { rows: audit } = await admin.query(
        `SELECT actor_type::text, actor_user_id, entity_id FROM app.audit_logs
         WHERE action = 'verification.document.url_issued'`,
      );
      expect(audit).toEqual([
        { actor_type: 'STAFF', actor_user_id: staff.reviewer, entity_id: docs[0].id },
        { actor_type: 'STAFF', actor_user_id: staff.reviewer, entity_id: docs[0].id },
      ]);
    });

    it('refuses staff without verification.view, members, and unknown documents', async () => {
      await submitRequest();
      const { rows: docs } = await admin.query(`SELECT id FROM app.verification_documents LIMIT 1`);
      await expect(verification.documentUrl(staffActor('EDITOR', staff.editor), docs[0].id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      await expect(verification.documentUrl(memberActor(sara.userId), docs[0].id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      await expect(
        verification.documentUrl(staffActor('REVIEWER', staff.reviewer), '0191f0a0-0000-7000-8000-0000000f0000'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(storage.issuedUrls).toEqual([]);
    });

    it('keeps documents out of every app response', async () => {
      await submitRequest();
      const res = await appRequest(app, 'get', '/me/verification', sara);
      const text = JSON.stringify(res.body);
      expect(text).not.toMatch(/private-documents|verification\/|memory:/);
      expect(res.body.data.files).toEqual({ IDENTITY: 'identity.pdf', EXPERIENCE: 'experience.pdf' });
    });
  });
});
