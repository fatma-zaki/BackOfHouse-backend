import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { TEST_STAFF_ID } from '../../support/test-actors';
import { COMPLETE } from './submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';
const REQUEST = {
  type: 'SUPPLIER_REQUEST',
  ...COMPLETE,
  title: 'LED wall for a concert',
  compensation: null,
  supplier_types: ['SUPPLIER'],
  work_setup: null,
};

/** Phase 5C: supplier requests and responses (contracts/app /company/supplier-*). */
describe('Supplier responses (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let buyer: RegisteredAccount;
  let supplierA: RegisteredAccount;
  let supplierB: RegisteredAccount;
  let agency: RegisteredAccount;
  let requestId: string;

  const expectApp = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('app', method, path, status, res.body)).toEqual([]);
  };

  const refusal = (res: request.Response) => ({
    status: res.status,
    code: res.body.code,
    ...(res.body.reason ? { reason: res.body.reason } : {}),
  });

  const publish = async (account: RegisteredAccount, body: object) => {
    const id = (await appRequest(app, 'post', '/company/opportunities', account).send(body)).body.data.id as string;
    expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, account)).status).toBe(200);
    const approved = await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(approved.status).toBe(200);
    return id;
  };

  const respond = (account: RegisteredAccount, body: object = {}) =>
    appRequest(app, 'post', '/company/supplier-responses', account).send({
      request_id: requestId,
      message: 'We can supply a 6×3 m wall.',
      ...body,
    });

  const move = (account: RegisteredAccount, id: string, status: string) =>
    appRequest(app, 'post', `/company/supplier-responses/${id}/status`, account).send({ status });

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
    buyer = await registerAccount(app, { name: 'Buyer', company: { name: 'Riyadh Stages', company_type: 'VENUE' } });
    supplierA = await registerAccount(app, {
      name: 'Owner A',
      company: { name: 'Bright LED', company_type: 'SUPPLIER' },
    });
    supplierB = await registerAccount(app, {
      name: 'Owner B',
      company: { name: 'Pixel Rentals', company_type: 'SUPPLIER' },
    });
    agency = await registerAccount(app, {
      name: 'Owner C',
      company: { name: 'Jeddah Agency', company_type: 'AGENCY' },
    });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [buyer.companyId]);
    requestId = await publish(buyer, REQUEST);
  });

  it('journey: invited suppliers respond, the buyer selects one, the rest are rejected and the request closes', async () => {
    const invited = await appRequest(app, 'get', '/company/supplier-requests/invited', supplierA);
    expectApp(invited, 'get', '/company/supplier-requests/invited', 200);
    expect(invited.body.data).toMatchObject([{ id: requestId, type: 'SUPPLIER_REQUEST', applicants: 0 }]);
    expect((await appRequest(app, 'get', '/company/supplier-requests/invited', agency)).body.data).toEqual([]);
    expect((await appRequest(app, 'get', '/company/supplier-requests/invited', buyer)).body.data).toEqual([]);
    expect((await appRequest(app, 'get', '/company/stats', supplierA)).body.data.supplier_invites).toBe(1);

    const project = await appRequest(app, 'post', '/company/projects', supplierA).send({
      title: 'Winter Wonderland screens',
      description: 'LED walls for the main stage',
      location: 'Riyadh',
      category: 'Technical Production',
      started_at: '2024-12-01',
    });
    expect(project.status).toBe(201);
    const a = await respond(supplierA, {
      proposed_price: 'SAR 180,000 all-in',
      setup_time: '2 days on site',
      project_ids: [project.body.data.id],
    });
    expectApp(a, 'post', '/company/supplier-responses', 201);
    expect(a.body.data).toMatchObject({
      request_id: requestId,
      request_title: 'LED wall for a concert',
      buyer: { id: buyer.companyId },
      responder: { id: supplierA.companyId },
      proposed_price: 'SAR 180,000 all-in',
      status: 'SUBMITTED',
      projects: [{ id: project.body.data.id, title: 'Winter Wonderland screens' }],
    });
    const b = await respond(supplierB, { proposed_price: 'SAR 150,000' });
    expect(b.status).toBe(201);
    expect((await appRequest(app, 'get', '/company/stats', supplierA)).body.data.supplier_invites).toBe(0);

    const detail = await appRequest(app, 'get', `/company/supplier-requests/${requestId}`, supplierA);
    expectApp(detail, 'get', '/company/supplier-requests/{id}', 200);
    expect(detail.body.data.applicants).toBe(2);
    expect(detail.body.data.reviewer_note).toBeUndefined();
    expect((await appRequest(app, 'get', `/company/supplier-requests/${requestId}`, buyer)).body.data).toMatchObject({
      applicants: 2,
      reviewer_note: null,
    });

    const forBuyer = await appRequest(app, 'get', `/company/supplier-requests/${requestId}/responses`, buyer);
    expectApp(forBuyer, 'get', '/company/supplier-requests/{id}/responses', 200);
    expect(forBuyer.body.data.map((r: { proposed_price: string }) => r.proposed_price).sort()).toEqual([
      'SAR 150,000',
      'SAR 180,000 all-in',
    ]);
    // Responders never see each other's responses or prices.
    expect((await appRequest(app, 'get', `/company/supplier-responses/${b.body.data.id}`, supplierA)).status).toBe(404);
    expect((await appRequest(app, 'get', `/company/supplier-requests/${requestId}/responses`, supplierA)).status).toBe(
      404,
    );

    const skip = await move(buyer, a.body.data.id, 'SELECTED');
    expectApp(skip, 'post', '/company/supplier-responses/{id}/status', 409);
    expect(skip.body.code).toBe('INVALID_TRANSITION');
    const byResponder = await move(supplierA, a.body.data.id, 'REVIEWED');
    expectApp(byResponder, 'post', '/company/supplier-responses/{id}/status', 403);
    for (const status of ['REVIEWED', 'SHORTLISTED']) {
      expect((await move(buyer, a.body.data.id, status)).body.data.status).toBe(status);
    }
    const selected = await move(buyer, a.body.data.id, 'SELECTED');
    expectApp(selected, 'post', '/company/supplier-responses/{id}/status', 200);
    expect(selected.body.data.status).toBe('SELECTED');

    const other = await appRequest(app, 'get', `/company/supplier-responses/${b.body.data.id}`, supplierB);
    expectApp(other, 'get', '/company/supplier-responses/{id}', 200);
    expect(other.body.data.status).toBe('REJECTED');
    expect((await appRequest(app, 'get', `/company/opportunities/${requestId}`, buyer)).body.data.status).toBe(
      'CLOSED',
    );
    expect((await move(buyer, b.body.data.id, 'REVIEWED')).body.code).toBe('INVALID_TRANSITION');
    expect((await appRequest(app, 'get', '/company/supplier-requests/invited', supplierA)).body.data).toEqual([]);

    const mine = await appRequest(app, 'get', '/company/supplier-responses', supplierA);
    expectApp(mine, 'get', '/company/supplier-responses', 200);
    expect(mine.body.data).toMatchObject([{ id: a.body.data.id, status: 'SELECTED' }]);

    // Drain the outbox (one run handles a batch).
    while ((await dispatcher.dispatchOnce()).claimed > 0);
    const typesOf = async (userId: string) =>
      (
        await admin.query<{ type: string; status: string | null }>(
          `SELECT type, payload->>'status' AS status FROM app.notifications WHERE recipient_user_id = $1 ORDER BY created_at, id`,
          [userId],
        )
      ).rows;
    expect((await typesOf(buyer.userId)).filter((n) => n.type === 'supplier.response_received')).toHaveLength(2);
    expect(await typesOf(supplierA.userId)).toEqual(
      ['REVIEWED', 'SHORTLISTED', 'SELECTED'].map((status) => ({ type: 'supplier.response_status_changed', status })),
    );
    expect(await typesOf(supplierB.userId)).toEqual([{ type: 'supplier.response_status_changed', status: 'REJECTED' }]);

    // The back office sees the request and its responses, without prices.
    const list = await request(app.getHttpServer())
      .get(`${ADMIN}/supplier-requests?status=AWARDED`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(list.status).toBe(200);
    expect(contractErrors('admin', 'get', '/supplier-requests', 200, list.body)).toEqual([]);
    expect(list.body.data).toMatchObject([{ id: requestId, applications_count: 2, status: 'CLOSED' }]);
    expect(list.body.kpis.map((k: { key: string; value: number }) => [k.key, k.value])).toEqual([
      ['open_requests', 0],
      ['awarded_requests', 1],
      ['responses', 2],
    ]);
    const open = await request(app.getHttpServer())
      .get(`${ADMIN}/supplier-requests?status=OPEN`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(open.body.data).toEqual([]);
    const responses = await request(app.getHttpServer())
      .get(`${ADMIN}/supplier-requests/${requestId}/responses`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(responses.status).toBe(200);
    expect(contractErrors('admin', 'get', '/supplier-requests/{id}/responses', 200, responses.body)).toEqual([]);
    expect(responses.body.data.map((r: { status: string; stage: string }) => [r.status, r.stage]).sort()).toEqual([
      ['AWARDED', 'SELECTED'],
      ['DECLINED', 'REJECTED'],
    ]);
    expect(JSON.stringify(responses.body)).not.toContain('SAR 1');
    expect(
      (await request(app.getHttpServer()).get(`${ADMIN}/supplier-requests`).set('x-test-actor', 'staff:SUPPORT'))
        .status,
    ).toBe(403);
  });

  it('refuses responses with a reason, a second response, and foreign projects', async () => {
    const job = await publish(buyer, { type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
    expect(refusal(await respond(supplierA, { request_id: job }))).toEqual({
      status: 403,
      code: 'NOT_ELIGIBLE',
      reason: 'NOT_SUPPLIER_REQUEST',
    });
    const own = await respond(buyer);
    expectApp(own, 'post', '/company/supplier-responses', 403);
    expect(refusal(own)).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'OWN_REQUEST' });
    expect(refusal(await respond(agency))).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'NOT_INVITED' });

    const theirs = await appRequest(app, 'post', '/company/projects', supplierB).send({
      title: 'Not yours',
      description: 'x',
      location: 'Riyadh',
      category: 'Other',
      started_at: '2024-01-01',
    });
    const foreign = await respond(supplierA, { project_ids: [theirs.body.data.id] });
    expectApp(foreign, 'post', '/company/supplier-responses', 422);
    expect(foreign.body.errors).toEqual({ project_ids: ["must be your company's own projects"] });
    expect((await respond(supplierA, { message: '' })).body.errors).toEqual({ message: ['is required'] });

    expect((await respond(supplierA)).status).toBe(201);
    const twice = await respond(supplierA);
    expectApp(twice, 'post', '/company/supplier-responses', 409);
    expect(twice.body.code).toBe('ALREADY_RESPONDED');

    await appRequest(app, 'post', `/company/opportunities/${requestId}/close`, buyer);
    expect(refusal(await respond(supplierB))).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'CLOSED' });
    // A closed request cannot be awarded any more.
    const [response] = (await appRequest(app, 'get', `/company/supplier-requests/${requestId}/responses`, buyer)).body
      .data;
    await move(buyer, response.id, 'REVIEWED');
    await move(buyer, response.id, 'SHORTLISTED');
    expect((await move(buyer, response.id, 'SELECTED')).body.code).toBe('INVALID_TRANSITION');

    const member = await registerAccount(app, { name: 'Member' });
    expect((await appRequest(app, 'get', '/company/supplier-requests/invited', member)).status).toBe(403);
    expect((await appRequest(app, 'get', `/company/supplier-requests/${requestId}`, agency)).status).toBe(404);
  });
});
