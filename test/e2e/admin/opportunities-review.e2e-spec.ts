import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { TEST_STAFF_ID } from '../../support/test-actors';
import { COMPLETE } from '../app/submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';
const JOB = { type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE };

/** Phase 5A: listing review in the back office (contracts/admin /opportunities*). */
describe('Opportunity review in the back office (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let venue: RegisteredAccount;
  let member: RegisteredAccount;

  const staff = (method: 'get' | 'post', path: string, role = 'REVIEWER') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const expectAdmin = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('admin', method, path, status, res.body)).toEqual([]);
  };

  /** Created and submitted by the venue; returns the id. */
  const submitted = async (body: object = JOB) => {
    const created = await appRequest(app, 'post', '/company/opportunities', venue).send(body);
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue)).status).toBe(200);
    return id;
  };

  const auditActions = async (id: string) =>
    (
      await admin.query<{ action: string }>(
        `SELECT action FROM app.audit_logs WHERE entity_type = 'opportunity' AND entity_id = $1 ORDER BY created_at, id`,
        [id],
      )
    ).rows.map((r) => r.action);

  const companyNotifications = async () =>
    (
      await admin.query<{ type: string; title: string }>(
        `SELECT type, payload->>'title' AS title FROM app.notifications WHERE recipient_user_id = $1 ORDER BY created_at, id`,
        [venue.userId],
      )
    ).rows;

  beforeAll(async () => {
    ({ app } = await bootApp({ testStaff: true }));
    dispatcher = app.get(OutboxDispatcher);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES ($1, 'reviewer@backofhouse.test', 'Rana Reviewer', 'REVIEWER', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    venue = await registerAccount(app, {
      name: 'Venue Owner',
      company: { name: 'Riyadh Stages', company_type: 'VENUE' },
    });
    member = await registerAccount(app, { name: 'Huda Rigger' });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [venue.companyId]);
  });

  it('journey: submit → approve → visible in /opportunities', async () => {
    const id = await submitted();
    expect((await appRequest(app, 'get', `/opportunities/${id}`, member)).status).toBe(404);

    const queue = await staff('get', '/opportunities?status=IN_REVIEW');
    expectAdmin(queue, 'get', '/opportunities', 200);
    expect(queue.body.data.map((o: { id: string }) => o.id)).toEqual([id]);
    expect(queue.body.data[0]).toMatchObject({
      status: 'IN_REVIEW',
      sla_state: 'OK',
      resubmitted: false,
      auto_flagged: false,
      is_revision: false,
      company: { name: 'Riyadh Stages', category: 'VENUE', verified: true },
      pay: { min: null, max: null, currency: 'SAR', note: 'SAR 12k / mo' },
    });

    const detail = await staff('get', `/opportunities/${id}`);
    expectAdmin(detail, 'get', '/opportunities/{id}', 200);
    expect(detail.body.data.checks.map((c: { key: string; result: string }) => [c.key, c.result])).toEqual([
      ['COMPANY_VERIFIED', 'PASS'],
      ['NO_CONTACT_DETAILS', 'PASS'],
      ['WORKING_HOURS_PRESENT', 'PASS'],
      ['PAY_PRESENT', 'PASS'],
      ['NO_FEE_LANGUAGE', 'PASS'],
    ]);

    const approved = await staff('post', `/opportunities/${id}/approve`);
    expectAdmin(approved, 'post', '/opportunities/{id}/approve', 200);
    expect(approved.body.data).toMatchObject({ status: 'PUBLISHED', published_at: expect.any(String) });
    expect(approved.body.data.history).toMatchObject([
      { decision: 'APPROVED', revision: false, reviewer: { id: TEST_STAFF_ID, name: 'Rana Reviewer' } },
    ]);

    const live = await appRequest(app, 'get', '/opportunities', member);
    expect(live.body.data.map((o: { id: string }) => o.id)).toEqual([id]);
    expect(await auditActions(id)).toEqual(['opportunity.create', 'opportunity.submit', 'opportunity.approve']);

    await dispatcher.dispatchOnce();
    expect(await companyNotifications()).toEqual([{ type: 'opportunity.approved', title: 'Rigging lead' }]);
    const bell = await admin.query(`SELECT type FROM app.staff_notifications WHERE type LIKE 'staff.opportunity%'`);
    expect(bell.rows.map((r) => r.type)).toContain('staff.opportunity_submitted');
  });

  it("tells the company's followers about a new listing, but not about revisions or supplier requests", async () => {
    expect((await appRequest(app, 'put', `/companies/${venue.companyId}/follow`, member)).status).toBe(200);
    const id = await submitted();
    await staff('post', `/opportunities/${id}/approve`);
    await appRequest(app, 'post', `/company/opportunities/${id}/revision`, venue);
    await appRequest(app, 'patch', `/company/opportunities/${id}/revision`, venue).send({
      type: 'JOB',
      title: 'New title',
    });
    await appRequest(app, 'post', `/company/opportunities/${id}/revision/submit`, venue);
    await staff('post', `/opportunities/${id}/approve`);
    const request_ = await submitted({
      type: 'SUPPLIER_REQUEST',
      ...COMPLETE,
      supplier_types: ['SUPPLIER'],
      work_setup: null,
    });
    await staff('post', `/opportunities/${request_}/approve`);

    await dispatcher.dispatchOnce();
    const sent = await admin.query<{ type: string; title: string; company: string; target_id: string }>(
      `SELECT type, payload->>'title' AS title, payload->>'company_name' AS company, target_id
         FROM app.notifications WHERE recipient_user_id = $1`,
      [member.userId],
    );
    expect(sent.rows).toEqual([
      { type: 'opportunity.new_from_followed', title: 'Rigging lead', company: 'Riyadh Stages', target_id: id },
    ]);
    const feed = await appRequest(app, 'get', '/me/notifications', member);
    expect(feed.body.data[0]).toMatchObject({
      title: 'New from Riyadh Stages',
      body: 'Riyadh Stages posted Rigging lead.',
    });
  });

  it('asks for changes, takes the listing back after edits, and keeps the history', async () => {
    const id = await submitted();
    const asked = await staff('post', `/opportunities/${id}/request-changes`).send({
      reasons: ['PAY_UNCLEAR'],
      message: 'Please give the monthly pay range.',
    });
    expectAdmin(asked, 'post', '/opportunities/{id}/request-changes', 200);
    expect(asked.body.data.status).toBe('CHANGES_REQUESTED');

    const own = (await appRequest(app, 'get', `/company/opportunities/${id}`, venue)).body.data;
    expect(own).toMatchObject({ status: 'CHANGES_REQUESTED', reviewer_note: 'Please give the monthly pay range.' });
    const edited = await appRequest(app, 'patch', `/company/opportunities/${id}`, venue).send({
      type: 'JOB',
      compensation: 'SAR 10k – 14k / mo',
    });
    expect(edited.body.data.status).toBe('CHANGES_REQUESTED');
    const again = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue);
    expect(again.body.data).toMatchObject({ status: 'IN_REVIEW', reviewer_note: null });

    const detail = (await staff('get', `/opportunities/${id}`)).body.data;
    expect(detail).toMatchObject({ resubmitted: true, pay: { note: 'SAR 10k – 14k / mo' } });
    expect(detail.history).toMatchObject([
      { decision: 'CHANGES_REQUESTED', reasons: ['PAY_UNCLEAR'], message: 'Please give the monthly pay range.' },
    ]);

    const noMessage = await staff('post', `/opportunities/${id}/request-changes`).send({ reasons: ['OTHER'] });
    expect({ status: noMessage.status, errors: noMessage.body.errors }).toEqual({
      status: 422,
      errors: { message: ['is required'] },
    });

    await dispatcher.dispatchOnce();
    expect(await companyNotifications()).toEqual([{ type: 'opportunity.changes_requested', title: 'Rigging lead' }]);
  });

  it('rejects a listing for good; the app shows it CLOSED with the note', async () => {
    const id = await submitted();
    const rejected = await staff('post', `/opportunities/${id}/reject`).send({
      reasons: ['MISLEADING'],
      message: 'This listing does not describe a real role.',
    });
    expectAdmin(rejected, 'post', '/opportunities/{id}/reject', 200);
    expect(rejected.body.data.status).toBe('REJECTED');
    expect((await appRequest(app, 'get', `/company/opportunities/${id}`, venue)).body.data).toMatchObject({
      status: 'CLOSED',
      reviewer_note: 'This listing does not describe a real role.',
    });
    const late = await staff('post', `/opportunities/${id}/approve`);
    expectAdmin(late, 'post', '/opportunities/{id}/approve', 409);
    expect(late.body.code).toBe('INVALID_TRANSITION');
  });

  it('flags contact details and fees into a moderation case, and removing it takes the listing down', async () => {
    const id = await submitted({
      ...JOB,
      description: 'Shifts of 10 hours. A registration fee of SAR 200 applies; email jobs@stages.sa',
    });
    const detail = (await staff('get', `/opportunities/${id}`)).body.data;
    expect(detail.auto_flagged).toBe(true);
    expect(
      detail.checks.filter((c: { result: string }) => c.result === 'FAIL').map((c: { key: string }) => c.key),
    ).toEqual(['NO_CONTACT_DETAILS', 'NO_FEE_LANGUAGE']);

    await dispatcher.dispatchOnce();
    const cases = await staff('get', '/moderation/cases?target_type=OPPORTUNITY');
    expect(cases.status).toBe(200);
    expect(cases.body.data).toMatchObject([
      { target_type: 'OPPORTUNITY', source: 'AUTO_FILTER', status: 'OPEN', target: { id, title: 'Rigging lead' } },
    ]);

    const removed = await staff('post', `/moderation/cases/${cases.body.data[0].id}/actions`).send({
      action: 'REMOVE_CONTENT',
      message: 'Applicants are never charged fees.',
    });
    expect(removed.status).toBe(200);
    await dispatcher.dispatchOnce();
    expect((await staff('get', `/opportunities/${id}`)).body.data.status).toBe('REJECTED');
  });

  it('closes a live listing with a reason (moderation.act) and tells the company', async () => {
    const id = await submitted();
    await staff('post', `/opportunities/${id}/approve`);
    const noReason = await staff('post', `/opportunities/${id}/close`).send({});
    expect(noReason.body.errors).toEqual({ reason: ['is required'] });
    const closed = await staff('post', `/opportunities/${id}/close`, 'SUPER_ADMIN').send({ reason: 'Filled offline' });
    expectAdmin(closed, 'post', '/opportunities/{id}/close', 200);
    expect(closed.body.data.status).toBe('CLOSED');
    expect((await appRequest(app, 'get', `/opportunities/${id}`, member)).status).toBe(404);

    await dispatcher.dispatchOnce();
    expect((await companyNotifications()).map((n) => n.type)).toEqual([
      'opportunity.approved',
      'opportunity.closed_by_staff',
    ]);
    expect((await staff('post', `/opportunities/${id}/close`).send({ reason: 'again' })).body.code).toBe(
      'INVALID_TRANSITION',
    );
  });

  it("lists a company's listings, and keeps Support and Editors out", async () => {
    const id = await submitted();
    const ofCompany = await staff('get', `/companies/${venue.companyId}/opportunities`);
    expectAdmin(ofCompany, 'get', '/companies/{id}/opportunities', 200);
    expect(ofCompany.body.data.map((o: { id: string }) => o.id)).toEqual([id]);
    expect(ofCompany.body.meta).toEqual({ page: 1, page_size: 20, total: 1, total_pages: 1 });
    expect((await staff('get', '/companies/0191f0a0-0000-7000-8000-00000000dead/opportunities')).status).toBe(404);

    expect((await staff('get', '/opportunities', 'SUPPORT')).status).toBe(403);
    expect((await staff('post', `/opportunities/${id}/approve`, 'EDITOR')).status).toBe(403);
    expect((await staff('get', '/opportunities/not-an-id')).status).toBe(404);
  });
});
