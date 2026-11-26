import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';
import { COMPLETE } from './submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';

/** Phase 5B: applications (contracts/app /me/applications*, /company/applicants*). */
describe('Applications (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let venue: RegisteredAccount;
  let other: RegisteredAccount;
  let member: RegisteredAccount;
  let job: string;
  let experienceId: string;
  let projectId: string;

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

  /** Created, submitted and approved by `account`; returns the id. */
  const publish = async (account: RegisteredAccount, body: object) => {
    const created = await appRequest(app, 'post', '/company/opportunities', account).send(body);
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, account)).status).toBe(200);
    const approved = await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(approved.status).toBe(200);
    clock.advance(60_000);
    return id;
  };

  /** One experience item (and one project) on the account's profile; returns their ids. */
  const profileItems = async (account: RegisteredAccount) => {
    const experience = await appRequest(app, 'post', '/me/experience', account).send({
      role: 'Rigger',
      company: 'Stage Co',
      start: '2022-01-01',
    });
    const project = await appRequest(app, 'post', '/me/projects', account).send({
      year: 2024,
      category: 'Concert',
      title: 'Winter tour',
      role: 'Head rigger',
    });
    return { experienceId: experience.body.data.id as string, projectId: project.body.data.id as string };
  };

  const apply = (account: RegisteredAccount, body: object) =>
    appRequest(app, 'post', '/me/applications', account).send(body);

  const move = (account: RegisteredAccount, id: string, status: string) =>
    appRequest(app, 'post', `/company/applicants/${id}/status`, account).send({ status });

  const notificationsOf = async (userId: string) =>
    (
      await admin.query<{ type: string; status: string }>(
        `SELECT type, payload->>'status' AS status FROM app.notifications WHERE recipient_user_id = $1 ORDER BY created_at, id`,
        [userId],
      )
    ).rows;

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
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
    other = await registerAccount(app, {
      name: 'Other Owner',
      company: { name: 'Jeddah Lights', company_type: 'AGENCY' },
    });
    member = await registerAccount(app, { name: 'Huda Rigger' });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [venue.companyId]);
    job = await publish(venue, { type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
    ({ experienceId, projectId } = await profileItems(member));
  });

  it('journey: apply → the company moves it to CONTACT → contact released as shared → accepted', async () => {
    await appRequest(app, 'patch', '/me/profile', member).send({
      name: 'Huda Rigger',
      headline: 'Head rigger',
      city: 'Riyadh',
      about: '',
      profile_status: 'PROFESSIONAL',
      interests: [],
      contact_privacy: { share_email: true, share_phone: false },
    });

    const applied = await apply(member, {
      opportunity_id: job,
      experience_ids: [experienceId],
      project_ids: [projectId],
      message: 'Ten years on festival rigs.',
    });
    expectApp(applied, 'post', '/me/applications', 201);
    const id = applied.body.data.id as string;
    expect(applied.body.data).toMatchObject({
      reference: expect.stringMatching(/^AP-\d+$/),
      opportunity_id: job,
      opportunity_title: 'Rigging lead',
      opportunity_type: 'JOB',
      company: { id: venue.companyId, name: 'Riyadh Stages' },
      employment_type: 'FULL_TIME',
      compensation: 'SAR 12k / mo',
      status: 'SUBMITTED',
      applicant: { name: 'Huda Rigger', headline: 'Head rigger', profile_status: 'PROFESSIONAL', verified: false },
      message: 'Ten years on festival rigs.',
      experience: [{ id: experienceId, role: 'Rigger' }],
      projects: [{ id: projectId, title: 'Winter tour' }],
    });
    expect(JSON.stringify(applied.body.data.applicant)).not.toContain(member.email);

    const listing = (await appRequest(app, 'get', `/opportunities/${job}`, member)).body.data;
    expect(listing).toMatchObject({ applicants: 1, my_application: { id, status: 'SUBMITTED' } });

    // The listing changes later; the application keeps what the member applied to.
    await admin.query(`UPDATE app.opportunities SET title = 'Renamed' WHERE id = $1`, [job]);

    const forListing = await appRequest(app, 'get', `/company/opportunities/${job}/applicants`, venue);
    expectApp(forListing, 'get', '/company/opportunities/{id}/applicants', 200);
    expect(forListing.body.data).toMatchObject([
      { application_id: id, opportunity_title: 'Rigging lead', status: 'SUBMITTED', contact: null },
    ]);
    const opened = await appRequest(app, 'get', `/company/applicants/${id}`, venue);
    expectApp(opened, 'get', '/company/applicants/{id}', 200);
    expect(opened.body.data).toMatchObject({ status: 'SUBMITTED', contact: null });

    const skip = await move(venue, id, 'SHORTLISTED');
    expectApp(skip, 'post', '/company/applicants/{id}/status', 409);
    expect(skip.body.code).toBe('INVALID_TRANSITION');
    for (const status of ['REVIEWED', 'SHORTLISTED']) {
      const moved = await move(venue, id, status);
      expectApp(moved, 'post', '/company/applicants/{id}/status', 200);
      expect(moved.body.data).toMatchObject({ status, contact: null });
    }
    const contact = await move(venue, id, 'CONTACT');
    expect(contact.body.data.contact).toEqual({ email: member.email, phone: null });
    const accepted = await move(venue, id, 'ACCEPTED');
    expect(accepted.body.data).toMatchObject({ status: 'ACCEPTED', contact: { email: member.email, phone: null } });
    expect((await move(venue, id, 'REJECTED')).body.code).toBe('INVALID_TRANSITION');

    const mine = await appRequest(app, 'get', '/me/applications', member);
    expectApp(mine, 'get', '/me/applications', 200);
    expect(mine.body.data).toMatchObject([{ id, status: 'ACCEPTED', opportunity_title: 'Rigging lead' }]);

    while ((await dispatcher.dispatchOnce()).claimed > 0);
    expect(await notificationsOf(member.userId)).toEqual(
      ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'CONTACT', 'ACCEPTED'].map((status) => ({
        type: 'application.status_changed',
        status,
      })),
    );
    const feed = await appRequest(app, 'get', '/me/notifications', member);
    expect(feed.status).toBe(200);
    expect(contractErrors('app', 'get', '/me/notifications', 200, feed.body)).toEqual([]);
    expect(feed.body.data[0]).toMatchObject({
      category: 'OPPORTUNITIES',
      target_type: 'OPPORTUNITY',
      target_id: job,
      application_update: { application_id: id, opportunity_title: 'Rigging lead', status: 'ACCEPTED' },
    });
  });

  it('keeps contact details back at CONTACT when the applicant shares nothing', async () => {
    const id = (await apply(member, { opportunity_id: job, experience_ids: [experienceId] })).body.data.id;
    for (const status of ['REVIEWED', 'SHORTLISTED']) await move(venue, id, status);
    expect((await move(venue, id, 'CONTACT')).body.data).toMatchObject({ status: 'CONTACT', contact: null });
  });

  it('refuses ineligible applicants with a reason, in the contract order', async () => {
    const coop = await publish(venue, { type: 'CO_OP', ...COMPLETE, title: 'Co-op crew', compensation: null });
    const notStudent = await apply(member, { opportunity_id: coop, experience_ids: [experienceId] });
    expectApp(notStudent, 'post', '/me/applications', 403);
    expect(refusal(notStudent)).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'STUDENTS_ONLY' });

    const student = await registerAccount(app, { name: 'Sara Student', profileStatus: 'STUDENT' });
    const items = await profileItems(student);
    expect((await apply(student, { opportunity_id: coop, experience_ids: [items.experienceId] })).status).toBe(201);

    const request_ = await publish(venue, {
      type: 'SUPPLIER_REQUEST',
      ...COMPLETE,
      title: 'LED wall',
      supplier_types: ['SUPPLIER'],
      work_setup: null,
    });
    const companyFacing = await apply(member, { opportunity_id: request_, experience_ids: [experienceId] });
    expect(refusal(companyFacing)).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'COMPANY_FACING' });

    await appRequest(app, 'post', `/company/opportunities/${coop}/close`, venue);
    const closed = await apply(member, { opportunity_id: coop, experience_ids: [experienceId] });
    expect(refusal(closed)).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'CLOSED' });

    const timed = await publish(venue, {
      type: 'VOLUNTEERING',
      ...COMPLETE,
      title: 'Stewards',
      compensation: null,
      closes_at: new Date(clock.now().getTime() + 24 * 3_600_000).toISOString(),
    });
    // Past its closing time, before the autoclose job runs.
    await admin.query(`UPDATE app.opportunities SET closes_at = $2 WHERE id = $1`, [
      timed,
      new Date(clock.now().getTime() - 60_000),
    ]);
    const late = await apply(member, { opportunity_id: timed, experience_ids: [experienceId] });
    expect(refusal(late)).toEqual({ status: 403, code: 'NOT_ELIGIBLE', reason: 'CLOSED' });

    const draft = (await appRequest(app, 'post', '/company/opportunities', venue).send({ type: 'JOB' })).body.data.id;
    expect((await apply(member, { opportunity_id: draft, experience_ids: [experienceId] })).status).toBe(404);
    const byCompany = await appRequest(app, 'post', '/me/applications', venue).send({
      opportunity_id: job,
      experience_ids: [experienceId],
    });
    expect(refusal(byCompany)).toEqual({ status: 403, code: 'FORBIDDEN' });
  });

  it('checks the picks: at least one experience item, all from the applicant’s own profile', async () => {
    const none = await apply(member, { opportunity_id: job, experience_ids: [] });
    expectApp(none, 'post', '/me/applications', 422);
    expect(none.body.errors).toEqual({ experience_ids: ['select at least one experience item'] });

    const stranger = await registerAccount(app, { name: 'Someone Else' });
    const theirs = await profileItems(stranger);
    const foreign = await apply(member, {
      opportunity_id: job,
      experience_ids: [theirs.experienceId],
      project_ids: [theirs.projectId],
    });
    expect(foreign.body.errors).toEqual({
      experience_ids: ['must be from your own profile'],
      project_ids: ['must be from your own profile'],
    });
    const long = await apply(member, { opportunity_id: job, experience_ids: [experienceId], message: 'x'.repeat(501) });
    expect(long.body.errors).toEqual({ message: ['must be at most 500 characters'] });
  });

  it('blocks a second application until the first is withdrawn, and a decided one for good', async () => {
    const first = (await apply(member, { opportunity_id: job, experience_ids: [experienceId] })).body.data.id;
    const twice = await apply(member, { opportunity_id: job, experience_ids: [experienceId] });
    expectApp(twice, 'post', '/me/applications', 409);
    expect(twice.body.code).toBe('ALREADY_APPLIED');

    const withdrawn = await appRequest(app, 'post', `/me/applications/${first}/withdraw`, member);
    expectApp(withdrawn, 'post', '/me/applications/{id}/withdraw', 200);
    expect(withdrawn.body.data.status).toBe('WITHDRAWN');
    const again = await appRequest(app, 'post', `/me/applications/${first}/withdraw`, member);
    expectApp(again, 'post', '/me/applications/{id}/withdraw', 409);
    expect((await move(venue, first, 'REVIEWED')).body.code).toBe('INVALID_TRANSITION');

    const second = await apply(member, { opportunity_id: job, experience_ids: [experienceId] });
    expect(second.status).toBe(201);
    const listing = (await appRequest(app, 'get', `/opportunities/${job}`, member)).body.data;
    expect(listing).toMatchObject({ applicants: 1, my_application: { id: second.body.data.id, status: 'SUBMITTED' } });

    expect((await move(venue, second.body.data.id, 'REJECTED')).body.data.status).toBe('REJECTED');
    const afterRejection = await apply(member, { opportunity_id: job, experience_ids: [experienceId] });
    expect(afterRejection.body.code).toBe('ALREADY_APPLIED');
    expect((await appRequest(app, 'post', `/me/applications/${second.body.data.id}/withdraw`, member)).status).toBe(
      409,
    );

    while ((await dispatcher.dispatchOnce()).claimed > 0);
    expect((await notificationsOf(member.userId)).map((n) => n.status)).toEqual([
      'SUBMITTED',
      'WITHDRAWN',
      'SUBMITTED',
      'REJECTED',
    ]);
  });

  it('keeps applicants to the owning company, and fills the dashboard counts', async () => {
    const id = (await apply(member, { opportunity_id: job, experience_ids: [experienceId] })).body.data.id;
    expect((await appRequest(app, 'get', `/company/applicants/${id}`, other)).status).toBe(404);
    expect((await move(other, id, 'REVIEWED')).status).toBe(404);
    expect((await appRequest(app, 'get', `/company/opportunities/${job}/applicants`, other)).status).toBe(404);
    expect((await appRequest(app, 'get', `/company/applicants/${id}`, member)).status).toBe(403);
    expect((await appRequest(app, 'post', `/me/applications/${id}/withdraw`, venue)).status).toBe(403);
    const stranger = await registerAccount(app, { name: 'Not The Applicant' });
    expect((await appRequest(app, 'post', `/me/applications/${id}/withdraw`, stranger)).status).toBe(404);
    const badStatus = await move(venue, id, 'WITHDRAWN');
    expect({ status: badStatus.status, errors: badStatus.body.errors }).toEqual({
      status: 422,
      errors: { status: ['is not a status you can set'] },
    });

    const recent = await appRequest(app, 'get', '/company/applicants/recent?limit=3', venue);
    expectApp(recent, 'get', '/company/applicants/recent', 200);
    expect(recent.body.data.map((a: { application_id: string }) => a.application_id)).toEqual([id]);

    const stats = (await appRequest(app, 'get', '/company/stats', venue)).body.data;
    expect(stats).toMatchObject({ live_listings: 1, new_applicants: 1, new_applicants_this_week: 1 });
    await move(venue, id, 'REVIEWED');
    await admin.query(`UPDATE app.applications SET submitted_at = submitted_at - interval '8 days' WHERE id = $1`, [
      id,
    ]);
    expect((await appRequest(app, 'get', '/company/stats', venue)).body.data).toMatchObject({
      new_applicants: 0,
      new_applicants_this_week: 0,
    });
    const own = (await appRequest(app, 'get', `/company/opportunities/${job}`, venue)).body.data;
    expect(own.applicants).toBe(1);
    expect(own.my_application).toBeUndefined();
  });
});
