import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { ArticlesService } from '../../../src/modules/content';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';
const HOUR = 3_600_000;

const EN = {
  headline: 'GEA publishes new rigging rules',
  excerpt: 'What changes in March',
  body: '<p>From March.</p>',
};
const AR = { headline: 'هيئة الترفيه تنشر قواعد جديدة', excerpt: 'ما الذي يتغير', body: '<p>من مارس.</p>' };

/** Phase 7 content lane: the editorial desk, checked against contracts/admin. */
describe('Articles in the back office (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let articles: ArticlesService;
  let reader: RegisteredAccount;

  const staff = (method: 'get' | 'post' | 'patch', path: string, role = 'EDITOR') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const expectAdmin = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('admin', method, path, status, res.body)).toEqual([]);
  };

  const draft = async (body: object = { category: 'REGULATORY', en: EN }) => {
    const res = await staff('post', '/articles').send(body);
    expectAdmin(res, 'post', '/articles', 201);
    return res.body.data as { id: string; slug: string };
  };

  const auditActions = async (id: string) =>
    (
      await admin.query<{ action: string }>(
        `SELECT action FROM app.audit_logs WHERE entity_type = 'article' AND entity_id = $1 ORDER BY created_at, id`,
        [id],
      )
    ).rows.map((r) => r.action);

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
    articles = app.get(ArticlesService, { strict: false });
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
       VALUES ($1, 'editor@backofhouse.test', 'Noura Editor', 'EDITOR', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    reader = await registerAccount(app, { name: 'Reader One' });
  });

  it('creates a draft with sanitized HTML, lists it and opens it for editing', async () => {
    const created = await draft({
      category: 'TECHNICAL',
      en: { headline: 'Truss loads', body: '<p onclick="x()">Safe<script>alert(1)</script></p>' },
    });
    expect(created).toMatchObject({
      slug: expect.stringMatching(/^truss-loads-[0-9a-f]{8}$/),
      category: 'TECHNICAL',
      status: 'DRAFT',
      en: { headline: 'Truss loads', body: '<p>Safe</p>', excerpt: '', cta_label: null },
      ar: null,
      author: { id: TEST_STAFF_ID, name: 'Noura Editor' },
      reads: 0,
      scheduled_at: null,
      published_at: null,
    });

    const list = await staff('get', '/articles?status=DRAFT');
    expectAdmin(list, 'get', '/articles', 200);
    expect(list.body.meta).toEqual({ page: 1, page_size: 20, total: 1, total_pages: 1 });
    expect((await staff('get', '/articles?status=PUBLISHED')).body.data).toEqual([]);

    const detail = await staff('get', `/articles/${created.id}`);
    expectAdmin(detail, 'get', '/articles/{id}', 200);
    expect(await auditActions(created.id)).toEqual(['article.create']);
  });

  it('refuses to publish or schedule without Arabic: 422 TRANSLATION_MISSING', async () => {
    const { id } = await draft();
    const now = await staff('post', `/articles/${id}/schedule`).send({ publish_at: null });
    expectAdmin(now, 'post', '/articles/{id}/schedule', 422);
    expect(now.body).toMatchObject({
      code: 'TRANSLATION_MISSING',
      errors: { 'ar.headline': ['is required to publish'], 'ar.body': ['is required to publish'] },
    });
    const later = await staff('post', `/articles/${id}/schedule`).send({
      publish_at: new Date(clock.now().getTime() + HOUR).toISOString(),
    });
    expect(later.body.code).toBe('TRANSLATION_MISSING');
    expect((await staff('get', `/articles/${id}`)).body.data.status).toBe('DRAFT');
  });

  it('schedules an article and the job publishes it at the Riyadh time', async () => {
    const { id } = await draft();
    const autosave = await staff('patch', `/articles/${id}`).send({ ar: AR });
    expectAdmin(autosave, 'patch', '/articles/{id}', 200);

    // 12:00 Riyadh is 09:00 UTC.
    const at = '2026-10-30T12:00:00+03:00';
    const scheduled = await staff('post', `/articles/${id}/schedule`).send({ publish_at: at, notify_push: true });
    expectAdmin(scheduled, 'post', '/articles/{id}/schedule', 200);
    expect(scheduled.body.data).toMatchObject({ status: 'SCHEDULED', scheduled_at: '2026-10-30T09:00:00.000Z' });
    expect((await appRequest(app, 'get', `/news/${id}`, reader)).status).toBe(404);

    expect(await articles.releaseDue()).toBe(0);
    clock.advance(26 * HOUR);
    expect(await articles.releaseDue()).toBe(1);
    expect(await articles.releaseDue()).toBe(0);

    const live = (await staff('get', `/articles/${id}`)).body.data;
    expect(live).toMatchObject({ status: 'PUBLISHED', scheduled_at: null, published_at: '2026-10-30T09:00:00.000Z' });
    // A fresh sign-in: the earlier access token expired while the clock moved on.
    const later = await registerAccount(app, { name: 'Reader Two' });
    expect((await appRequest(app, 'get', `/news/${id}`, later)).status).toBe(200);

    const events = await admin.query(
      `SELECT event_name, payload->'data'->>'notify_push' AS push FROM app.outbox_events WHERE aggregate_id = $1`,
      [id],
    );
    expect(events.rows).toEqual([{ event_name: 'article.published', push: 'true' }]);
    expect(await auditActions(id)).toEqual(['article.create', 'article.update', 'article.schedule', 'article.publish']);
  });

  it('unschedules back to draft, and refuses moves the state machine does not allow', async () => {
    const { id } = await draft({ category: 'MARKET', en: EN, ar: AR });
    const early = await staff('post', `/articles/${id}/unschedule`);
    expect({ status: early.status, code: early.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });

    await staff('post', `/articles/${id}/schedule`).send({
      publish_at: new Date(clock.now().getTime() + HOUR).toISOString(),
    });
    const back = await staff('post', `/articles/${id}/unschedule`);
    expectAdmin(back, 'post', '/articles/{id}/unschedule', 200);
    expect(back.body.data).toMatchObject({ status: 'DRAFT', scheduled_at: null });

    const unpublishDraft = await staff('post', `/articles/${id}/unpublish`);
    expect(unpublishDraft.body.code).toBe('INVALID_TRANSITION');
    const past = await staff('post', `/articles/${id}/schedule`).send({
      publish_at: new Date(clock.now().getTime() - HOUR).toISOString(),
    });
    expect({ status: past.status, errors: past.body.errors }).toEqual({
      status: 422,
      errors: { publish_at: ['must not be in the past; leave it empty to publish now'] },
    });
  });

  it('publishes now, keeps a live article complete, and unpublishes it', async () => {
    const { id, slug } = await draft({ category: 'REGULATORY', en: EN, ar: AR });
    const published = await staff('post', `/articles/${id}/schedule`).send({ feature_on_home_days: 3 });
    expect(published.body.data).toMatchObject({ status: 'PUBLISHED', published_at: clock.now().toISOString() });

    const dropArabic = await staff('patch', `/articles/${id}`).send({ ar: { headline: '', body: AR.body } });
    expect({ status: dropArabic.status, code: dropArabic.body.code }).toEqual({
      status: 422,
      code: 'TRANSLATION_MISSING',
    });
    const typo = await staff('patch', `/articles/${id}`).send({ en: { ...EN, headline: 'Fixed headline' } });
    expect(typo.body.data).toMatchObject({ status: 'PUBLISHED', slug, en: { headline: 'Fixed headline' } });

    const again = await staff('post', `/articles/${id}/schedule`).send({});
    expect({ status: again.status, code: again.body.code }).toEqual({ status: 409, code: 'INVALID_TRANSITION' });

    const down = await staff('post', `/articles/${id}/unpublish`);
    expectAdmin(down, 'post', '/articles/{id}/unpublish', 200);
    expect(down.body.data.status).toBe('UNPUBLISHED');
    expect((await appRequest(app, 'get', `/news/${id}`, reader)).status).toBe(404);
    expect((await staff('get', '/articles?status=DRAFT')).body.data.map((a: { id: string }) => a.id)).toEqual([id]);
  });

  it('keeps a source, labels and interests, and wants both languages of each before publishing', async () => {
    const { id } = await draft({
      category: 'REGULATORY',
      en: EN,
      ar: AR,
      source: { en: 'General Entertainment Authority' },
      labels: [{ en: 'Mandatory', ar: 'إلزامي' }, { en: 'New' }, {}],
      interests: ['PRODUCTION', 'DESIGN'],
    });
    const saved = await staff('get', `/articles/${id}`);
    expectAdmin(saved, 'get', '/articles/{id}', 200);
    expect(saved.body.data).toMatchObject({
      source: { en: 'General Entertainment Authority', ar: '' },
      labels: [
        { en: 'Mandatory', ar: 'إلزامي' },
        { en: 'New', ar: '' },
      ],
      interests: ['PRODUCTION', 'DESIGN'],
    });

    const blocked = await staff('post', `/articles/${id}/schedule`).send({});
    expect({ status: blocked.status, code: blocked.body.code, errors: blocked.body.errors }).toEqual({
      status: 422,
      code: 'TRANSLATION_MISSING',
      errors: { 'source.ar': ['is required to publish'], 'labels.1.ar': ['is required to publish'] },
    });
    const checks = await staff('get', `/articles/${id}/checks`);
    expect(checks.body.data[0]).toMatchObject({ key: 'BOTH_LANGUAGES', result: 'FAIL' });

    const fixed = await staff('patch', `/articles/${id}`).send({
      source: { en: 'General Entertainment Authority', ar: 'الهيئة العامة للترفيه' },
      labels: [{ en: 'Mandatory', ar: 'إلزامي' }],
    });
    expectAdmin(fixed, 'patch', '/articles/{id}', 200);
    expect((await staff('post', `/articles/${id}/schedule`).send({})).body.data.status).toBe('PUBLISHED');

    const tooMany = await staff('patch', `/articles/${id}`).send({ labels: Array(6).fill({ en: 'a', ar: 'b' }) });
    expect(tooMany.body.code).toBe('VALIDATION_FAILED');
    const repeated = await staff('patch', `/articles/${id}`).send({ interests: ['DESIGN', 'DESIGN'] });
    expect(repeated.body.errors).toEqual({ interests: ['must not repeat an interest'] });
    const cleared = await staff('patch', `/articles/${id}`).send({ source: null, labels: [], interests: [] });
    expect(cleared.body.data).toMatchObject({ source: null, labels: [], interests: [] });
  });

  it('runs the pre-publish checklist', async () => {
    const owner = await registerAccount(app, {
      name: 'Venue Owner',
      company: { name: 'Riyadh Stages', company_type: 'VENUE' },
    });
    const { id } = await draft({
      category: 'MARKET',
      en: { headline: 'x'.repeat(75), body: '<p>Riyadh Stages opens a new hall.</p>' },
      link: { type: 'COMPANY', id: owner.companyId },
    });
    const res = await staff('get', `/articles/${id}/checks`);
    expectAdmin(res, 'get', '/articles/{id}/checks', 200);
    expect(res.body.data.map((c: { key: string; result: string }) => [c.key, c.result])).toEqual([
      ['BOTH_LANGUAGES', 'FAIL'],
      ['COVER_ALT', 'PASS'],
      ['LINKED_ITEM_LIVE', 'PASS'],
      ['HEADLINE_LENGTH', 'WARN'],
      ['PARTNER_MENTION', 'WARN'],
    ]);
    expect(res.body.data[4].message).toContain('Riyadh Stages');

    await admin.query(`UPDATE app.users SET status = 'SUSPENDED', suspended_at = now() WHERE id = $1`, [owner.userId]);
    const after = await staff('get', `/articles/${id}/checks`);
    expect(after.body.data[2]).toMatchObject({ key: 'LINKED_ITEM_LIVE', result: 'FAIL' });
  });

  it('refuses cover uploads until the upload pipeline exists, and unknown fields', async () => {
    const cover = await staff('post', '/articles').send({ cover_upload_id: '0191f0a0-0000-7000-8000-00000000c001' });
    expect({ status: cover.status, errors: cover.body.errors }).toEqual({
      status: 422,
      errors: { cover_upload_id: ['cover images arrive with uploads (POST /uploads)'] },
    });
    const unknown = await staff('post', '/articles').send({ category: 'NOT_A_TOPIC' });
    expect(unknown.body.code).toBe('VALIDATION_FAILED');
    expect((await staff('get', '/articles/not-a-uuid')).status).toBe(404);
  });

  it('lets a Super admin manage news and keeps a Reviewer out', async () => {
    expect((await staff('post', '/articles', 'SUPER_ADMIN').send({ en: EN })).status).toBe(201);
    expect((await staff('get', '/articles', 'REVIEWER')).status).toBe(403);
  });
});
