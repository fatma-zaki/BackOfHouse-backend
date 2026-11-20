import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { contractErrors } from '../support/contract';
import { connectAdmin, resetDatabase } from '../support/database';
import { TEST_STAFF_ID } from '../support/test-actors';
import { COMPLETE } from '../e2e/app/submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';

/**
 * Exit test (execution-plan Phase 5, P2): while a revision is pending, GET /opportunities/{id}
 * returns the live version; after approval it returns the revised one; after a rejection the
 * live version is unchanged.
 */
describe('Revising a live listing (integration)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let venue: RegisteredAccount;
  let member: RegisteredAccount;
  let id: string;

  const staff = (path: string) =>
    request(app.getHttpServer()).post(`${ADMIN}${path}`).set('x-test-actor', 'staff:REVIEWER');
  const live = async () => (await appRequest(app, 'get', `/opportunities/${id}`, member)).body.data;
  const own = async () => (await appRequest(app, 'get', `/company/opportunities/${id}`, venue)).body.data;
  const company = (method: 'post' | 'patch', path: string) =>
    appRequest(app, method, `/company/opportunities/${id}${path}`, venue);

  beforeAll(async () => {
    ({ app } = await bootApp({ testStaff: true }));
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
    venue = await registerAccount(app, { name: 'Owner', company: { name: 'Riyadh Stages', company_type: 'VENUE' } });
    member = await registerAccount(app, { name: 'Huda Rigger' });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [venue.companyId]);
    const created = await appRequest(app, 'post', '/company/opportunities', venue).send({
      type: 'JOB',
      employment_type: 'FULL_TIME',
      ...COMPLETE,
    });
    id = created.body.data.id;
    await company('post', '/submit');
    expect((await staff(`/opportunities/${id}/approve`)).status).toBe(200);
  });

  it('keeps the live version up while a revision is pending, and swaps it in on approval', async () => {
    const started = await company('post', '/revision');
    expect(started.status).toBe(201);
    expect(contractErrors('app', 'post', '/company/opportunities/{id}/revision', 201, started.body)).toEqual([]);
    expect(started.body.data.revision).toMatchObject({ status: 'DRAFT', draft: { title: 'Rigging lead' } });
    const twice = await company('post', '/revision');
    expect({ status: twice.status, code: twice.body.code }).toEqual({ status: 409, code: 'REVISION_EXISTS' });

    const edited = await company('patch', '/revision').send({ type: 'JOB', title: 'Senior rigging lead' });
    expect(contractErrors('app', 'patch', '/company/opportunities/{id}/revision', 200, edited.body)).toEqual([]);
    const direct = await company('patch', '').send({ type: 'JOB', title: 'Sneaky edit' });
    expect({ status: direct.status, code: direct.body.code }).toEqual({ status: 409, code: 'NOT_EDITABLE' });

    const sent = await company('post', '/revision/submit');
    expect(contractErrors('app', 'post', '/company/opportunities/{id}/revision/submit', 200, sent.body)).toEqual([]);
    expect(sent.body.data).toMatchObject({ status: 'PUBLISHED', revision: { status: 'IN_REVIEW' } });

    expect(await live()).toMatchObject({ status: 'PUBLISHED', title: 'Rigging lead' });
    const queue = await request(app.getHttpServer())
      .get(`${ADMIN}/opportunities?status=IN_REVIEW`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(queue.body.data).toMatchObject([
      {
        id,
        status: 'PUBLISHED',
        title: 'Rigging lead',
        is_revision: true,
        revision: {
          status: 'IN_REVIEW',
          changes: [{ field: 'title', before: 'Rigging lead', after: 'Senior rigging lead' }],
        },
      },
    ]);

    const approved = await staff(`/opportunities/${id}/approve`);
    expect(approved.body.data).toMatchObject({ title: 'Senior rigging lead', is_revision: false, revision: null });
    expect(await live()).toMatchObject({ status: 'PUBLISHED', title: 'Senior rigging lead' });
    expect((await own()).revision).toBeNull();
  });

  it('leaves the live version unchanged when a revision gets changes requested or is rejected', async () => {
    await company('post', '/revision');
    await company('patch', '/revision').send({ type: 'JOB', title: 'Rigging lead (urgent!!)' });
    await company('post', '/revision/submit');

    await staff(`/opportunities/${id}/request-changes`).send({ message: 'Keep the title plain.' });
    expect((await own()).revision).toMatchObject({
      status: 'CHANGES_REQUESTED',
      reviewer_note: 'Keep the title plain.',
    });
    expect(await live()).toMatchObject({ title: 'Rigging lead' });

    await company('patch', '/revision').send({ type: 'JOB', title: 'Rigging lead, urgent' });
    const resent = await company('post', '/revision/submit');
    expect(resent.body.data.revision).toMatchObject({ status: 'IN_REVIEW', reviewer_note: null });

    const rejected = await staff(`/opportunities/${id}/reject`).send({ message: 'Not a real change.' });
    expect(rejected.body.data).toMatchObject({ status: 'PUBLISHED', revision: null, title: 'Rigging lead' });
    expect(await live()).toMatchObject({ status: 'PUBLISHED', title: 'Rigging lead' });
    expect((await own()).revision).toBeNull();

    const history = (
      await request(app.getHttpServer()).get(`${ADMIN}/opportunities/${id}`).set('x-test-actor', 'staff:REVIEWER')
    ).body.data.history;
    expect(history.map((h: { decision: string; revision: boolean }) => [h.decision, h.revision])).toEqual([
      ['APPROVED', false],
      ['CHANGES_REQUESTED', true],
      ['REJECTED', true],
    ]);
  });

  it('drops a pending revision when the listing closes, and revises only live listings', async () => {
    await company('post', '/revision');
    await company('post', '/close');
    expect(await own()).toMatchObject({ status: 'CLOSED', revision: null });
    const late = await company('post', '/revision');
    expect({ status: late.status, code: late.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });
    const noRevision = await company('patch', '/revision').send({ type: 'JOB', title: 'x' });
    expect({ status: noRevision.status, code: noRevision.body.code }).toEqual({
      status: 409,
      code: 'INVALID_TRANSITION',
    });
  });
});
