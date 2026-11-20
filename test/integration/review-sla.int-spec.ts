import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { OpportunityReviewService } from '../../src/modules/opportunities';
import { OutboxDispatcher } from '../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { connectAdmin, resetDatabase } from '../support/database';
import { FakeClock } from '../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../support/test-actors';
import { COMPLETE } from '../e2e/app/submit-job-unverified.e2e-spec';

const ADMIN = '/api/admin/v1';
const HOUR = 3_600_000;

/**
 * Exit test (execution-plan Phase 5): the review deadline (24 h by default) is DUE_SOON at
 * 20 h after submission and OVERDUE at 24 h + 1 s; the overdue alert goes out once. The
 * autoclose job closes listings past `closes_at`.
 */
describe('Review SLA and listing jobs (integration)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let reviews: OpportunityReviewService;
  let dispatcher: OutboxDispatcher;
  let venue: RegisteredAccount;

  const slaOf = async (id: string) =>
    (await request(app.getHttpServer()).get(`${ADMIN}/opportunities/${id}`).set('x-test-actor', 'staff:REVIEWER')).body
      .data;

  const submit = async (extra: object = {}) => {
    const created = await appRequest(app, 'post', '/company/opportunities', venue).send({
      type: 'VOLUNTEERING',
      ...COMPLETE,
      compensation: null,
      ...extra,
    });
    const id = created.body.data.id as string;
    expect((await appRequest(app, 'post', `/company/opportunities/${id}/submit`, venue)).status).toBe(200);
    return id;
  };

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
    reviews = app.get(OpportunityReviewService, { strict: false });
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
    venue = await registerAccount(app, { name: 'Owner', company: { name: 'Riyadh Stages', company_type: 'VENUE' } });
  });

  it('is DUE_SOON at 20 h and OVERDUE at 24 h + 1 s, and alerts the reviewers once', async () => {
    const submittedAt = clock.now().getTime();
    const id = await submit();
    const first = await slaOf(id);
    expect(first).toMatchObject({
      sla_state: 'OK',
      submitted_at: new Date(submittedAt).toISOString(),
      review_due_at: new Date(submittedAt + 24 * HOUR).toISOString(),
    });

    clock.advance(20 * HOUR - 1000);
    expect((await slaOf(id)).sla_state).toBe('OK');
    clock.advance(1000);
    expect((await slaOf(id)).sla_state).toBe('DUE_SOON');
    expect(await reviews.alertOverdue()).toBe(0);

    clock.advance(4 * HOUR + 1000);
    expect((await slaOf(id)).sla_state).toBe('OVERDUE');
    expect(await reviews.alertOverdue()).toBe(1);
    expect(await reviews.alertOverdue()).toBe(0);

    await dispatcher.dispatchOnce();
    const bell = await admin.query(
      `SELECT type, count(*)::int AS n FROM app.staff_notifications WHERE type = 'staff.opportunity_overdue' GROUP BY type`,
    );
    expect(bell.rows).toEqual([{ type: 'staff.opportunity_overdue', n: 1 }]);

    // A decision ends the clock.
    await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect((await slaOf(id)).sla_state).toBe('OK');
  });

  it('closes listings past their closing time and tells the company', async () => {
    const id = await submit({ closes_at: new Date(clock.now().getTime() + 48 * HOUR).toISOString() });
    await request(app.getHttpServer())
      .post(`${ADMIN}/opportunities/${id}/approve`)
      .set('x-test-actor', 'staff:REVIEWER');
    expect(await reviews.closeExpired()).toBe(0);
    clock.advance(48 * HOUR);
    expect(await reviews.closeExpired()).toBe(1);
    expect(await reviews.closeExpired()).toBe(0);
    expect((await slaOf(id)).status).toBe('CLOSED');

    await dispatcher.dispatchOnce();
    const sent = await admin.query(
      `SELECT type FROM app.notifications WHERE recipient_user_id = $1 ORDER BY created_at`,
      [venue.userId],
    );
    expect(sent.rows.map((r) => r.type)).toEqual(['opportunity.approved', 'opportunity.expired']);
  });
});
