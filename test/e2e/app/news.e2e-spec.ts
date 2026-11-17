import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';
const MINUTE = 60_000;

/** Phase 7 content lane: news in the app (contracts/app /news*). */
describe('News in the app (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let member: RegisteredAccount;
  let other: RegisteredAccount;
  let company: RegisteredAccount;

  const expectApp = (res: request.Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('app', method, path, status, res.body)).toEqual([]);
  };

  /** Writes and publishes an article through the admin routes; returns its id. */
  const publish = async (
    topic: string,
    headline: string,
    options: { feature?: number; publish?: boolean; body?: string } = {},
  ): Promise<string> => {
    const editor = (method: 'post', path: string) =>
      request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', 'staff:EDITOR');
    const created = await editor('post', '/articles').send({
      category: topic,
      en: { headline, excerpt: `${headline} in short`, body: options.body ?? `<p>${headline} body text.</p>` },
      ar: { headline: `${headline} بالعربية`, body: '<p>نص الخبر.</p>' },
    });
    const id = created.body.data.id as string;
    if (options.publish !== false) {
      const res = await editor('post', `/articles/${id}/schedule`).send({
        feature_on_home_days: options.feature ?? null,
      });
      expect(res.status).toBe(200);
    }
    clock.advance(MINUTE);
    return id;
  };

  const ids = (res: request.Response) => res.body.data.map((a: { id: string }) => a.id);

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
       VALUES ($1, 'editor@backofhouse.test', 'Noura Editor', 'EDITOR', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    member = await registerAccount(app, { name: 'Huda Rigger' });
    other = await registerAccount(app, { name: 'Omar Light' });
    company = await registerAccount(app, {
      name: 'Venue Owner',
      company: { name: 'Riyadh Stages', company_type: 'VENUE' },
    });
  });

  describe('reading', () => {
    it('lists live articles: FOR_YOU leads with featured ones, LATEST is newest first', async () => {
      const featured = await publish('REGULATORY', 'Rigging rules', { feature: 3 });
      const market = await publish('MARKET', 'Ticket sales rise');
      const technical = await publish('TECHNICAL', 'LED walls');
      await publish('TECHNICAL', 'Unfinished draft', { publish: false });

      const forYou = await appRequest(app, 'get', '/news', member);
      expectApp(forYou, 'get', '/news', 200);
      expect(ids(forYou)).toEqual([featured, technical, market]);
      expect(forYou.body.meta).toEqual({ page: 1, page_size: 20, has_more: false });
      expect(forYou.body.data[0]).toMatchObject({
        topic: 'REGULATORY',
        category: 'Regulatory',
        title: 'Rigging rules',
        summary: 'Rigging rules in short',
        source: 'Back of House',
        teaser: 'Rigging rules body text.',
        read_minutes: 1,
        breaking: true,
        like_count: 0,
        liked: false,
        comment_count: 0,
        saved: false,
      });
      expect(forYou.body.data[0].body).toBeUndefined();

      expect(ids(await appRequest(app, 'get', '/news?order=LATEST', member))).toEqual([technical, market, featured]);
      expect(ids(await appRequest(app, 'get', '/news?topic=MARKET', member))).toEqual([market]);
      expect(ids(await appRequest(app, 'get', '/news?q=led', member))).toEqual([technical]);

      const page = await appRequest(app, 'get', '/news?page=1&page_size=1', member);
      expect({ ids: ids(page), meta: page.body.meta }).toEqual({
        ids: [featured],
        meta: { page: 1, page_size: 1, has_more: true },
      });
      expect(ids(await appRequest(app, 'get', '/news?page=2&page_size=1', member))).toEqual([technical]);
      expect(ids(await appRequest(app, 'get', '/news?page=3&page_size=1', member))).toEqual([market]);

      // Featuring ends after N days (a fresh sign-in: the earlier token expired meanwhile).
      clock.advance(4 * 86_400_000);
      const later = await registerAccount(app, { name: 'Later Reader' });
      expect(ids(await appRequest(app, 'get', '/news', later))).toEqual([technical, market, featured]);
    });

    it('answers in the request language', async () => {
      const id = await publish('REGULATORY', 'Rigging rules');
      const res = await appRequest(app, 'get', `/news/${id}`, member, 'ar');
      expect(res.body.data).toMatchObject({
        title: 'Rigging rules بالعربية',
        category: 'تنظيمي',
        source: 'باك أوف هاوس',
        body: [{ type: 'PARAGRAPH', text: 'نص الخبر.' }],
      });
    });

    it('opens one article with its body and counts the read', async () => {
      const id = await publish('TECHNICAL', 'LED walls', {
        body: '<p>Intro</p><blockquote><p>Plan the load.</p><cite>— Chief rigger</cite></blockquote>',
      });
      const before = await admin.query(`SELECT updated_at FROM app.articles WHERE id = $1`, [id]);
      const res = await appRequest(app, 'get', `/news/${id}`, company);
      expectApp(res, 'get', '/news/{id}', 200);
      expect(res.body.data).toMatchObject({
        body: [
          { type: 'PARAGRAPH', text: 'Intro' },
          { type: 'QUOTE', text: 'Plan the load.', attribution: 'Chief rigger' },
        ],
        directives: [],
        keywords: [],
        author: null,
      });
      const reads = await admin.query(`SELECT reads, updated_at FROM app.articles WHERE id = $1`, [id]);
      expect(reads.rows).toEqual([{ reads: 1, updated_at: before.rows[0].updated_at }]);
      expect((await appRequest(app, 'get', '/news/0191f0a0-0000-7000-8000-00000000dead', member)).status).toBe(404);
      expect((await appRequest(app, 'get', '/news/not-an-id', member)).status).toBe(404);
      expect((await appRequest(app, 'get', `/news/${id}`)).status).toBe(401);
    });

    it('suggests related briefings, the same topic first', async () => {
      const otherTopic = await publish('MARKET', 'Market news');
      const sameTopic = await publish('TECHNICAL', 'Truss safety');
      const id = await publish('TECHNICAL', 'LED walls');
      const res = await appRequest(app, 'get', `/news/${id}/related`, member);
      expectApp(res, 'get', '/news/{id}/related', 200);
      expect(ids(res)).toEqual([sameTopic, otherTopic]);
    });

    it('hides drafts and unpublished articles everywhere', async () => {
      const draft = await publish('MARKET', 'Draft', { publish: false });
      const live = await publish('MARKET', 'Live');
      await request(app.getHttpServer())
        .post(`${ADMIN}/articles/${live}/unpublish`)
        .set('x-test-actor', 'staff:EDITOR');
      expect((await appRequest(app, 'get', '/news', member)).body.data).toEqual([]);
      for (const id of [draft, live]) {
        expect((await appRequest(app, 'get', `/news/${id}`, member)).status).toBe(404);
        expect((await appRequest(app, 'put', `/news/${id}/like`, member)).status).toBe(404);
        expect((await appRequest(app, 'get', `/news/${id}/comments`, member)).status).toBe(404);
      }
    });
  });

  describe('engagement', () => {
    it('saves for individuals and companies, and likes for individuals only', async () => {
      const id = await publish('MARKET', 'Ticket sales rise');

      const saved = await appRequest(app, 'put', `/news/${id}/save`, member);
      expectApp(saved, 'put', '/news/{id}/save', 200);
      expect(saved.body.data.saved).toBe(true);
      expect((await appRequest(app, 'put', `/news/${id}/save`, member)).body.data.saved).toBe(true);
      expect((await appRequest(app, 'put', `/news/${id}/save`, company)).body.data.saved).toBe(true);
      const unsaved = await appRequest(app, 'delete', `/news/${id}/save`, member);
      expectApp(unsaved, 'delete', '/news/{id}/save', 200);
      expect(unsaved.body.data.saved).toBe(false);

      const liked = await appRequest(app, 'put', `/news/${id}/like`, member);
      expectApp(liked, 'put', '/news/{id}/like', 200);
      expect(liked.body.data).toMatchObject({ liked: true, like_count: 1 });
      expect((await appRequest(app, 'put', `/news/${id}/like`, member)).body.data.like_count).toBe(1);
      expect((await appRequest(app, 'put', `/news/${id}/like`, other)).body.data).toMatchObject({
        liked: true,
        like_count: 2,
      });

      const byCompany = await appRequest(app, 'put', `/news/${id}/like`, company);
      expectApp(byCompany, 'put', '/news/{id}/like', 403);
      expect(byCompany.body.code).toBe('ENGAGEMENT_NOT_ALLOWED');
      expect((await appRequest(app, 'delete', `/news/${id}/like`, company)).body.code).toBe('ENGAGEMENT_NOT_ALLOWED');

      const unliked = await appRequest(app, 'delete', `/news/${id}/like`, member);
      expectApp(unliked, 'delete', '/news/{id}/like', 200);
      expect(unliked.body.data).toMatchObject({ liked: false, like_count: 1 });

      const list = await appRequest(app, 'get', '/news', other);
      expect(list.body.data[0]).toMatchObject({ liked: true, saved: false, like_count: 1 });
    });

    it('takes flat comments from individuals, which only the author deletes', async () => {
      const id = await publish('MARKET', 'Ticket sales rise');
      await admin.query(
        `INSERT INTO app.profiles (user_id, headline, updated_at) VALUES ($1, 'Head rigger', now())
         ON CONFLICT (user_id) DO UPDATE SET headline = EXCLUDED.headline`,
        [member.userId],
      );

      const posted = await appRequest(app, 'post', `/news/${id}/comments`, member).send({ text: '  Great news  ' });
      expectApp(posted, 'post', '/news/{id}/comments', 201);
      expect(posted.body.data).toMatchObject({
        article_id: id,
        author_name: 'Huda Rigger',
        author_headline: 'Head rigger',
        author_avatar_url: null,
        text: 'Great news',
        mine: true,
      });
      clock.advance(MINUTE);
      const second = await appRequest(app, 'post', `/news/${id}/comments`, other).send({ text: 'Agreed' });

      const blank = await appRequest(app, 'post', `/news/${id}/comments`, member).send({ text: '   ' });
      expectApp(blank, 'post', '/news/{id}/comments', 422);
      const long = await appRequest(app, 'post', `/news/${id}/comments`, member).send({ text: 'x'.repeat(501) });
      expect(long.body.code).toBe('VALIDATION_FAILED');
      const byCompany = await appRequest(app, 'post', `/news/${id}/comments`, company).send({ text: 'Hello' });
      expectApp(byCompany, 'post', '/news/{id}/comments', 403);
      expect(byCompany.body.code).toBe('ENGAGEMENT_NOT_ALLOWED');

      const read = await appRequest(app, 'get', `/news/${id}/comments`, company);
      expectApp(read, 'get', '/news/{id}/comments', 200);
      expect(read.body.data.map((c: { text: string; mine: boolean }) => [c.text, c.mine])).toEqual([
        ['Agreed', false],
        ['Great news', false],
      ]);
      expect((await appRequest(app, 'get', `/news/${id}`, member)).body.data.comment_count).toBe(2);

      const notMine = await appRequest(app, 'delete', `/news/${id}/comments/${second.body.data.id}`, member);
      expectApp(notMine, 'delete', '/news/{id}/comments/{commentId}', 403);
      expect(notMine.body.code).toBe('ENGAGEMENT_NOT_ALLOWED');
      const deleted = await appRequest(app, 'delete', `/news/${id}/comments/${posted.body.data.id}`, member);
      expectApp(deleted, 'delete', '/news/{id}/comments/{commentId}', 204);
      const gone = await appRequest(app, 'delete', `/news/${id}/comments/${posted.body.data.id}`, member);
      expect(gone.status).toBe(404);
      expect((await appRequest(app, 'get', `/news/${id}/comments`, member)).body.data).toHaveLength(1);
    });
  });
});
