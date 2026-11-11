import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { ModerationService } from '../../../src/modules/moderation';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { memberActor, TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';

/** Phase 4B: companies, page claims and moderation in the back office, checked against contracts/admin. */
describe('Companies, claims and moderation (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let moderation: ModerationService;
  let owner: RegisteredAccount;
  let reporter: RegisteredAccount;
  let other: RegisteredAccount;

  const staff = (method: 'get' | 'post' | 'patch', path: string, role = 'SUPER_ADMIN') =>
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
    dispatcher = app.get(OutboxDispatcher);
    moderation = app.get(ModerationService, { strict: false });
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
       VALUES ($1, 'sa@backofhouse.test', 'Sami Admin', 'SUPER_ADMIN', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    owner = await registerAccount(app, {
      name: 'Faisal Owner',
      company: { name: 'Stagecraft Co.', company_type: 'VENUE' },
    });
    reporter = await registerAccount(app, { name: 'Reporter One' });
    other = await registerAccount(app, { name: 'Reporter Two' });
  });

  describe('companies', () => {
    it('lists with kpis and shows a company with its slug, team and allowed actions', async () => {
      const list = await staff('get', '/companies?q=stage');
      expectAdmin(list, 'get', '/companies', 200);
      expect(list.body.data[0]).toMatchObject({
        id: owner.companyId,
        slug: expect.stringMatching(/^stagecraft-co-[0-9a-f]{8}$/),
        category: 'VENUE',
        status: 'ACTIVE',
        verification: 'NONE',
        source: 'SIGNUP',
        team_size: 1,
      });
      expect(list.body.kpis.map((k: { key: string }) => k.key)).toEqual([
        'companies',
        'verified',
        'suspended',
        'featured_to_watch',
      ]);
      expect((await staff('get', '/companies?category=SUPPLIER')).body.data).toEqual([]);

      const detail = await staff('get', `/companies/${owner.companyId}`);
      expectAdmin(detail, 'get', '/companies/{id}', 200);
      expect(detail.body.data.allowed_actions).toEqual(['EDIT', 'FEATURE', 'SUSPEND']);
      expect((await staff('get', `/companies/${owner.companyId}`, 'REVIEWER')).body.data.allowed_actions).toEqual([
        'EDIT',
      ]);

      const team = await staff('get', `/companies/${owner.companyId}/team`);
      expectAdmin(team, 'get', '/companies/{id}/team', 200);
      expect(team.body.data).toEqual([
        { user: expect.objectContaining({ id: owner.userId, full_name: 'Faisal Owner' }), role: 'OWNER' },
      ]);
    });

    it('lets a Super admin feature a company, and only a Super admin', async () => {
      const featured = await staff('patch', `/companies/${owner.companyId}`).send({
        featured_to_watch: true,
        featured_order: 2,
        city: 'Riyadh',
      });
      expectAdmin(featured, 'patch', '/companies/{id}', 200);
      expect(featured.body.data).toMatchObject({ featured_to_watch: true, featured_order: 2, city: 'Riyadh' });
      const picks = await appRequest(app, 'get', '/companies?editors_pick=true', reporter);
      expect(picks.body.data.map((c: { id: string }) => c.id)).toEqual([owner.companyId]);

      const byReviewer = await staff('patch', `/companies/${owner.companyId}`, 'REVIEWER').send({
        featured_to_watch: false,
      });
      expect({ status: byReviewer.status, code: byReviewer.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
      const editByReviewer = await staff('patch', `/companies/${owner.companyId}`, 'REVIEWER').send({
        category: 'SUPPLIER',
      });
      expect(editByReviewer.body.data).toMatchObject({ category: 'SUPPLIER', featured_to_watch: true });
    });

    it('suspends a company, hiding it from the directory', async () => {
      const res = await staff('post', `/companies/${owner.companyId}/suspend`).send({ reason: 'Fraud reports' });
      expectAdmin(res, 'post', '/companies/{id}/suspend', 200);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect((await appRequest(app, 'get', '/companies', reporter)).body.data).toEqual([]);
      expect((await appRequest(app, 'get', '/company', owner)).status).toBe(401);
    });

    it('removes a company verification only when there is one', async () => {
      const none = await staff('post', `/companies/${owner.companyId}/verification/remove`).send({ reason: 'x' });
      expect(none.body.code).toBe('INVALID_TRANSITION');
      await admin.query(`UPDATE app.companies SET verified_at = now(), verified_by_staff_id = $1`, [TEST_STAFF_ID]);
      const removed = await staff('post', `/companies/${owner.companyId}/verification/remove`).send({
        reason: 'Expired CR',
      });
      expectAdmin(removed, 'post', '/companies/{id}/verification/remove', 200);
      expect(removed.body.data).toMatchObject({ verified: false, verification: 'NONE', verified_by: null });
    });
  });

  describe('claims', () => {
    const newClaim = async (claimantId: string) =>
      (
        await admin.query(
          `INSERT INTO app.page_claims (id, company_id, claimant_user_id, email, evidence)
           VALUES (gen_random_uuid(), $1, $2, 'claimant@stagecraft.sa', 'DOMAIN_MATCH') RETURNING id`,
          [owner.companyId, claimantId],
        )
      ).rows[0].id as string;

    it('approves a claim: the page moves, the company is not verified', async () => {
      const id = await newClaim(reporter.userId);
      const list = await staff('get', '/claims?status=OPEN');
      expectAdmin(list, 'get', '/claims', 200);
      expect(list.body.data[0]).toMatchObject({ id, status: 'OPEN', claimant: { id: reporter.userId } });

      const approved = await staff('post', `/claims/${id}/approve`, 'REVIEWER');
      expectAdmin(approved, 'post', '/claims/{id}/approve', 200);
      expect(approved.body.data).toMatchObject({ status: 'APPROVED', company: { verified: false } });
      const { rows } = await admin.query(`SELECT account_user_id, verified_at FROM app.companies WHERE id = $1`, [
        owner.companyId,
      ]);
      expect(rows).toEqual([{ account_user_id: reporter.userId, verified_at: null }]);
      expect((await staff('post', `/claims/${id}/approve`)).body.code).toBe('INVALID_TRANSITION');
    });

    it('rejects a claim with a message', async () => {
      const id = await newClaim(other.userId);
      expect((await staff('post', `/claims/${id}/reject`).send({})).body.errors).toEqual({ message: ['is required'] });
      const rejected = await staff('post', `/claims/${id}/reject`).send({
        message: 'The email domain does not match.',
      });
      expectAdmin(rejected, 'post', '/claims/{id}/reject', 200);
      expect(rejected.body.data.status).toBe('REJECTED');
    });
  });

  describe('moderation', () => {
    const projectOf = async (account: RegisteredAccount) =>
      (
        await appRequest(app, 'post', '/company/projects', account).send({
          title: 'Fake award',
          description: 'Claims an award it never won.',
          location: 'Riyadh',
          category: 'Awards',
          started_at: '2026-01-01',
        })
      ).body.data.id as string;

    it('joins reports on one target into one case and lists its reasons', async () => {
      const projectId = await projectOf(owner);
      const target = { target_type: 'COMPANY_PROJECT', target_id: projectId };
      const first = await moderation.report(memberActor(reporter.userId), { ...target, reason: 'FAKE_PROFILE' });
      const second = await moderation.report(memberActor(other.userId), { ...target, reason: 'SCAM' });
      await moderation.report(memberActor(other.userId), { ...target, reason: 'SCAM' });
      expect(second.caseId).toBe(first.caseId);

      const list = await staff('get', '/moderation/cases?status=OPEN', 'SUPPORT');
      expectAdmin(list, 'get', '/moderation/cases', 200);
      expect(list.body.data).toHaveLength(1);
      const detail = await staff('get', `/moderation/cases/${first.caseId}`);
      expectAdmin(detail, 'get', '/moderation/cases/{id}', 200);
      expect(detail.body.data).toMatchObject({
        target_type: 'COMPANY_PROJECT',
        target: { id: projectId, title: 'Fake award', owner: 'Faisal Owner' },
        reports_count: 2,
        source: 'MEMBERS',
        status: 'OPEN',
        resolution: null,
      });
      expect((await staff('get', '/moderation/cases?reason=SPAM')).body.data).toEqual([]);
    });

    it('removes the content through the owning module and tells the owner', async () => {
      const projectId = await projectOf(owner);
      const { caseId } = await moderation.report(memberActor(reporter.userId), {
        target_type: 'COMPANY_PROJECT',
        target_id: projectId,
        reason: 'FAKE_PROFILE',
      });
      const acted = await staff('post', `/moderation/cases/${caseId}/actions`, 'REVIEWER').send({
        action: 'REMOVE_CONTENT',
        message: 'The award could not be confirmed.',
      });
      expectAdmin(acted, 'post', '/moderation/cases/{id}/actions', 200);
      expect(acted.body.data).toMatchObject({ status: 'RESOLVED', resolution: 'CONTENT_REMOVED' });
      expect((await admin.query(`SELECT count(*)::int AS n FROM app.company_projects`)).rows[0].n).toBe(1);

      await dispatcher.dispatchOnce();
      expect((await admin.query(`SELECT count(*)::int AS n FROM app.company_projects`)).rows[0].n).toBe(0);
      const { rows } = await admin.query(`SELECT type FROM app.notifications WHERE recipient_user_id = $1`, [
        owner.userId,
      ]);
      expect(rows).toEqual([{ type: 'moderation.content_removed' }]);

      const again = await staff('post', `/moderation/cases/${caseId}/actions`).send({ action: 'DISMISS' });
      expect(again.body.code).toBe('INVALID_TRANSITION');
    });

    it('warns with a message, suspends only with accounts.suspend, and keeps history', async () => {
      const userCase = await moderation.report(memberActor(reporter.userId), {
        target_type: 'USER',
        target_id: other.userId,
        reason: 'HARASSMENT',
      });
      expect(
        (await staff('post', `/moderation/cases/${userCase.caseId}/actions`).send({ action: 'WARN' })).body.errors,
      ).toEqual({
        message: ['is required to warn'],
      });
      const removeUser = await staff('post', `/moderation/cases/${userCase.caseId}/actions`).send({
        action: 'REMOVE_CONTENT',
      });
      expect(removeUser.status).toBe(422);
      const warned = await staff('post', `/moderation/cases/${userCase.caseId}/actions`).send({
        action: 'WARN',
        message: 'Please keep messages respectful.',
      });
      expect(warned.body.data.resolution).toBe('WARNED');

      const next = await moderation.report(memberActor(reporter.userId), {
        target_type: 'USER',
        target_id: other.userId,
        reason: 'HARASSMENT',
      });
      expect(next.caseId).not.toBe(userCase.caseId);
      const reviewerSuspend = await staff('post', `/moderation/cases/${next.caseId}/actions`, 'REVIEWER').send({
        action: 'SUSPEND_ACCOUNT',
      });
      expect({ status: reviewerSuspend.status, code: reviewerSuspend.body.code }).toEqual({
        status: 403,
        code: 'FORBIDDEN',
      });
      const detail = await staff('get', `/moderation/cases/${next.caseId}`);
      expect(detail.body.data.account_history).toBe('1 earlier case(s), 1 warning(s)');

      const suspended = await staff('post', `/moderation/cases/${next.caseId}/actions`).send({
        action: 'SUSPEND_ACCOUNT',
      });
      expect(suspended.body.data.resolution).toBe('ACCOUNT_SUSPENDED');
      expect((await appRequest(app, 'get', '/me', other)).status).toBe(401);
    });
  });
});
