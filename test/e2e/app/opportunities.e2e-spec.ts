import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';
import { COMPLETE } from './submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';
const HOUR = 3_600_000;

/** Phase 5A: listings in the app (contracts/app /opportunities*, /company/opportunities*). */
describe('Opportunities in the app (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let venue: RegisteredAccount;
  let supplier: RegisteredAccount;
  let member: RegisteredAccount;

  const expectApp = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('app', method, path, status, res.body)).toEqual([]);
  };

  const verify = (account: RegisteredAccount) =>
    admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [account.companyId]);

  const create = async (account: RegisteredAccount, body: object) => {
    const res = await appRequest(app, 'post', '/company/opportunities', account).send(body);
    expectApp(res, 'post', '/company/opportunities', 201);
    return res.body.data.id as string;
  };

  /** Created, submitted and approved; returns the id. */
  const publish = async (account: RegisteredAccount, body: object) => {
    const id = await create(account, body);
    expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, account)).status).toBe(200);
    const approved = await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(approved.status).toBe(200);
    clock.advance(60_000);
    return id;
  };

  const ids = (res: request.Response) => res.body.data.map((o: { id: string }) => o.id);

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
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
    supplier = await registerAccount(app, {
      name: 'Supplier Owner',
      company: { name: 'Bright LED', company_type: 'SUPPLIER' },
    });
    member = await registerAccount(app, { name: 'Huda Rigger' });
    await verify(venue);
  });

  describe('the company writes and submits', () => {
    it('saves an incomplete draft, edits it, and checks it on submit', async () => {
      const id = await create(venue, { type: 'JOB', title: 'Rigging lead' });
      const own = await appRequest(app, 'get', `/company/opportunities/${id}`, venue);
      expectApp(own, 'get', '/company/opportunities/{id}', 200);
      expect(own.body.data).toMatchObject({
        status: 'DRAFT',
        title: 'Rigging lead',
        company: { id: venue.companyId, is_verified: true, capabilities: ['CREATE_SUPPLIER_REQUEST'] },
        reviewer_note: null,
        revision: null,
        applicants: 0,
        match_score: null,
      });

      const incomplete = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue);
      expectApp(incomplete, 'post', '/company/opportunities/{id}/submit', 422);
      expect(incomplete.body.errors).toEqual({
        city: ['is required to submit'],
        summary: ['is required to submit'],
        description: ['is required to submit'],
        employment_type: ['is required to submit'],
      });

      const edited = await appRequest(app, 'patch', `/company/opportunities/${id}`, venue).send({
        type: 'JOB',
        ...COMPLETE,
        employment_type: 'FULL_TIME',
      });
      expectApp(edited, 'patch', '/company/opportunities/{id}', 200);
      const typeChange = await appRequest(app, 'patch', `/company/opportunities/${id}`, venue).send({ type: 'CO_OP' });
      expect({ status: typeChange.status, errors: typeChange.body.errors }).toEqual({
        status: 422,
        errors: { type: ['cannot change'] },
      });

      const submitted = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue);
      expect(submitted.body.data.status).toBe('IN_REVIEW');
      const locked = await appRequest(app, 'patch', `/company/opportunities/${id}`, venue).send({ type: 'JOB' });
      expectApp(locked, 'patch', '/company/opportunities/{id}', 409);
      expect(locked.body.code).toBe('NOT_EDITABLE');

      const back = await appRequest(app, 'post', `/company/opportunities/${id}/return-to-draft`, venue);
      expectApp(back, 'post', '/company/opportunities/{id}/return-to-draft', 200);
      expect(back.body.data.status).toBe('DRAFT');
      const again = await appRequest(app, 'post', `/company/opportunities/${id}/return-to-draft`, venue);
      expect({ status: again.status, code: again.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });

      const list = await appRequest(app, 'get', '/company/opportunities', venue);
      expectApp(list, 'get', '/company/opportunities', 200);
      expect(ids(list)).toEqual([id]);
    });

    it('keeps listings to their company and the workspace to Company Accounts', async () => {
      const id = await create(venue, { type: 'JOB' });
      expect((await appRequest(app, 'get', `/company/opportunities/${id}`, supplier)).status).toBe(404);
      expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, supplier)).status).toBe(404);
      const byMember = await appRequest(app, 'post', '/company/opportunities', member).send({ type: 'JOB' });
      expect({ status: byMember.status, code: byMember.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
      expect((await appRequest(app, 'get', '/company/opportunities/not-an-id', venue)).status).toBe(404);
    });

    it('lets only verified companies request suppliers (BQ-83)', async () => {
      const refused = await appRequest(app, 'post', '/company/opportunities', supplier).send({
        type: 'SUPPLIER_REQUEST',
      });
      expectApp(refused, 'post', '/company/opportunities', 403);
      expect(refused.body.code).toBe('CAPABILITY_REQUIRED');
      expect((await appRequest(app, 'get', '/company', supplier)).body.data.capabilities).toEqual([]);

      const wrongField = await appRequest(app, 'post', '/company/opportunities', venue).send({
        type: 'JOB',
        supplier_types: ['SUPPLIER'],
      });
      expect(wrongField.body.errors).toEqual({ supplier_types: ['is only for supplier requests'] });
      const request = await create(venue, {
        type: 'SUPPLIER_REQUEST',
        ...COMPLETE,
        supplier_types: ['SUPPLIER'],
        work_setup: null,
      });
      expect((await appRequest(app, 'get', `/company/opportunities/${request}`, venue)).body.data).toMatchObject({
        type: 'SUPPLIER_REQUEST',
        supplier_types: ['SUPPLIER'],
      });
    });
  });

  describe('discovery', () => {
    it('shows individuals individual-facing listings and companies the requests that invite them', async () => {
      const job = await publish(venue, { type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
      const volunteering = await publish(venue, {
        type: 'VOLUNTEERING',
        ...COMPLETE,
        title: 'Festival stewards',
        compensation: null,
      });
      const supplierRequest = await publish(venue, {
        type: 'SUPPLIER_REQUEST',
        ...COMPLETE,
        title: 'LED wall for a concert',
        supplier_types: ['SUPPLIER'],
        work_setup: null,
      });
      await create(venue, { type: 'JOB', ...COMPLETE, title: 'Unsubmitted draft' });

      const forMember = await appRequest(app, 'get', '/opportunities', member);
      expectApp(forMember, 'get', '/opportunities', 200);
      expect(ids(forMember)).toEqual([volunteering, job]);
      expect(forMember.body.meta).toEqual({ page: 1, page_size: 20, has_more: false });
      expect(forMember.body.data[1]).toMatchObject({
        type: 'JOB',
        status: 'PUBLISHED',
        company: { name: 'Riyadh Stages', company_type: 'VENUE', is_verified: true },
        employment_type: 'FULL_TIME',
        compensation: 'SAR 12k / mo',
        my_application: null,
      });
      expect(forMember.body.data[1].reviewer_note).toBeUndefined();
      expect(ids(await appRequest(app, 'get', '/opportunities?type=SUPPLIER_REQUEST', member))).toEqual([]);
      expect(ids(await appRequest(app, 'get', '/opportunities?q=steward', member))).toEqual([volunteering]);

      expect(ids(await appRequest(app, 'get', '/opportunities', supplier))).toEqual([
        supplierRequest,
        volunteering,
        job,
      ]);
      // The buyer does not see its own request among the invitations.
      expect(ids(await appRequest(app, 'get', '/opportunities', venue))).toEqual([volunteering, job]);

      const detail = await appRequest(app, 'get', `/opportunities/${job}`, member);
      expectApp(detail, 'get', '/opportunities/{id}', 200);
      expect((await appRequest(app, 'get', `/opportunities/${supplierRequest}`, member)).status).toBe(404);
      const views = await admin.query(`SELECT views FROM app.opportunities WHERE id = $1`, [job]);
      expect(views.rows[0].views).toBe(1);

      const ofCompany = await appRequest(app, 'get', `/companies/${venue.companyId}/opportunities`, member);
      expectApp(ofCompany, 'get', '/companies/{id}/opportunities', 200);
      expect(ids(ofCompany)).toEqual([volunteering, job]);
      expect((await appRequest(app, 'get', `/companies/${venue.companyId}`, member)).body.data.open_opportunities).toBe(
        3,
      );
      expect((await appRequest(app, 'get', '/company/stats', venue)).body.data.live_listings).toBe(3);
    });

    it('hides closed listings, listings past their closing time and suspended companies', async () => {
      const job = await publish(venue, {
        type: 'JOB',
        employment_type: 'FULL_TIME',
        ...COMPLETE,
        closes_at: new Date(clock.now().getTime() + 2 * HOUR).toISOString(),
      });
      const other = await publish(venue, { type: 'CO_OP', ...COMPLETE, title: 'Co-op crew', compensation: null });
      expect(ids(await appRequest(app, 'get', '/opportunities', member))).toEqual([other, job]);

      const closed = await appRequest(app, 'post', `/company/opportunities/${other}/close`, venue);
      expectApp(closed, 'post', '/company/opportunities/{id}/close', 200);
      expect(closed.body.data.status).toBe('CLOSED');
      expect(ids(await appRequest(app, 'get', '/opportunities', member))).toEqual([job]);

      clock.advance(3 * HOUR);
      const reader = await registerAccount(app, { name: 'Later Reader' });
      expect(ids(await appRequest(app, 'get', '/opportunities', reader))).toEqual([]);

      await admin.query(`UPDATE app.opportunities SET closes_at = NULL WHERE id = $1`, [job]);
      await admin.query(`UPDATE app.users SET status = 'SUSPENDED', suspended_at = now() WHERE id = $1`, [
        venue.userId,
      ]);
      expect(ids(await appRequest(app, 'get', '/opportunities', reader))).toEqual([]);
      expect((await appRequest(app, 'get', `/opportunities/${job}`, reader)).status).toBe(404);
    });
  });
});
