import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';
import { COMPLETE } from '../app/submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';
const DAY = 86_400_000;

/** Phase 5B: applications in the back office, read-only (contracts/admin /applications). */
describe('Applications in the back office (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let venue: RegisteredAccount;
  let member: RegisteredAccount;
  let student: RegisteredAccount;

  const staff = (path: string, role = 'SUPER_ADMIN') =>
    request(app.getHttpServer()).get(`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const publish = async (body: object) => {
    const id = (await appRequest(app, 'post', '/company/opportunities', venue).send(body)).body.data.id as string;
    await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue);
    await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    return id;
  };

  const applyAs = async (account: RegisteredAccount, opportunityId: string) => {
    const experience = await appRequest(app, 'post', '/me/experience', account).send({
      role: 'Crew',
      company: 'Stage Co',
      start: '2023-01-01',
    });
    const res = await appRequest(app, 'post', '/me/applications', account).send({
      opportunity_id: opportunityId,
      experience_ids: [experience.body.data.id],
    });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

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
    member = await registerAccount(app, { name: 'Huda Rigger' });
    student = await registerAccount(app, { name: 'Sara Student', profileStatus: 'STUDENT' });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [venue.companyId]);
  });

  it('lists every application with the admin status names, filters, and pages a user’s by cursor', async () => {
    const job = await publish({ type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
    const coop = await publish({ type: 'CO_OP', ...COMPLETE, title: 'Co-op crew', compensation: null });
    const first = await applyAs(member, job);
    clock.advance(60_000);
    const second = await applyAs(student, coop);
    clock.advance(60_000);
    const third = await applyAs(student, job);
    for (const status of ['REVIEWED', 'SHORTLISTED', 'CONTACT']) {
      await appRequest(app, 'post', `/company/applicants/${first}/status`, venue).send({ status });
    }
    clock.advance(3 * DAY);

    const all = await staff('/applications');
    expect(all.status).toBe(200);
    expect(contractErrors('admin', 'get', '/applications', 200, all.body)).toEqual([]);
    expect(all.body.meta).toEqual({ page: 1, page_size: 20, total: 3, total_pages: 1 });
    expect(all.body.data.map((a: { id: string }) => a.id)).toEqual([third, second, first]);
    expect(all.body.data[2]).toMatchObject({
      id: first,
      reference: expect.stringMatching(/^AP-\d+$/),
      applicant: { id: member.userId, full_name: 'Huda Rigger', verified: false, is_student: false },
      opportunity: { id: job, title: 'Rigging lead', type: 'JOB', company: { name: 'Riyadh Stages' } },
      status: 'SHORTLISTED',
      stage: 'CONTACT',
      time_in_stage_days: 3,
    });
    expect(JSON.stringify(all.body)).not.toContain(member.email);

    const ids = async (query: string) =>
      (await staff(`/applications?${query}`)).body.data.map((a: { id: string }) => a.id);
    expect(await ids('status=APPLIED')).toEqual([third, second]);
    expect(await ids('status=SHORTLISTED')).toEqual([first]);
    expect(await ids('type=CO_OP')).toEqual([second]);
    expect(await ids('q=huda')).toEqual([first]);
    expect(await ids('q=co-op')).toEqual([second]);
    expect(await ids(`company_id=${venue.companyId}&sort=created_at`)).toEqual([first, second, third]);
    expect((await staff('/applications?status=CONTACT')).status).toBe(422);

    const page1 = await staff(`/users/${student.userId}/applications?limit=1`);
    expect(page1.status).toBe(200);
    expect(contractErrors('admin', 'get', '/users/{id}/applications', 200, page1.body)).toEqual([]);
    expect(page1.body.data.map((a: { id: string }) => a.id)).toEqual([third]);
    expect(page1.body.meta.has_more).toBe(true);
    const page2 = await staff(
      `/users/${student.userId}/applications?limit=1&cursor=${encodeURIComponent(page1.body.meta.next_cursor)}`,
    );
    expect(page2.body.data.map((a: { id: string }) => a.id)).toEqual([second]);
    expect(page2.body.meta).toEqual({ next_cursor: null, has_more: false });
    expect((await staff('/users/0191f0a0-0000-7000-8000-00000000dead/applications')).status).toBe(404);
  });

  it('is for Super admins (applications.view); Support sees a user’s applications', async () => {
    expect((await staff('/applications', 'REVIEWER')).status).toBe(403);
    expect((await staff('/applications', 'SUPPORT')).status).toBe(403);
    expect((await staff(`/users/${member.userId}/applications`, 'SUPPORT')).status).toBe(200);
  });
});
