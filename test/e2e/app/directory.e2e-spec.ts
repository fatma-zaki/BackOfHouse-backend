import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import type { Response } from 'supertest';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';

const DAY = 86_400_000;

/** contracts/app Phase 3a: profile, companies, professionals and the company workspace. */
describe('Profiles and directories (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let sara: RegisteredAccount;
  let omar: RegisteredAccount;
  let stagecraft: RegisteredAccount;

  /** Asserts the status and that the body matches the contract for that operation. */
  const expectContract = (res: Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('app', method, path, status, res.body)).toEqual([]);
  };

  beforeAll(async () => {
    ({ app, clock } = await bootApp());
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani' });
    omar = await registerAccount(app, { name: 'Omar Haddad', profileStatus: 'STUDENT' });
    stagecraft = await registerAccount(app, {
      name: 'Faisal Owner',
      company: { name: 'Stagecraft Co.', company_type: 'PRODUCTION' },
    });
  });

  describe('/me/profile', () => {
    it('serves defaults before the first edit, then the edited profile', async () => {
      const before = await appRequest(app, 'get', '/me/profile', sara);
      expectContract(before, 'get', '/me/profile', 200);
      expect(before.body.data).toMatchObject({
        name: 'Sara Al-Qahtani',
        headline: '',
        profile_status: 'PROFESSIONAL',
        experience: [],
        contact_privacy: { share_email: false, share_phone: false },
      });

      const update = {
        name: 'Sara Q.',
        headline: 'Lead Producer',
        city: 'Riyadh',
        about: 'Festivals and concerts.',
        profile_status: 'STUDENT',
        interests: ['PRODUCTION', 'NETWORKING'],
        contact_privacy: { share_email: true, share_phone: false },
      };
      const patched = await appRequest(app, 'patch', '/me/profile', sara).send(update);
      expectContract(patched, 'patch', '/me/profile', 200);
      expect(patched.body.data).toMatchObject({ ...update, verified: false });

      const me = await appRequest(app, 'get', '/me', sara);
      expect(me.body.data).toMatchObject({
        full_name: 'Sara Q.',
        headline: 'Lead Producer',
        profile_status: 'STUDENT',
      });
    });

    it('validates the edit (422 with field errors)', async () => {
      const res = await appRequest(app, 'patch', '/me/profile', sara).send({
        name: 'S',
        headline: '',
        city: '',
        about: 'x'.repeat(601),
        profile_status: 'PROFESSIONAL',
        interests: ['DESIGN', 'DESIGN'],
        contact_privacy: {},
      });
      expect(res.status).toBe(422);
      expect(Object.keys(res.body.errors).sort()).toEqual(['about', 'interests', 'name']);
    });
  });

  describe('/me/projects', () => {
    const project = { year: 2025, category: 'Concerts', title: 'MDLBEAST Soundstorm', role: 'Stage manager' };

    it('adds, edits and deletes projects, which the profile lists newest year first', async () => {
      const created = await appRequest(app, 'post', '/me/projects', sara).send(project);
      expectContract(created, 'post', '/me/projects', 201);
      expect(created.body.data).toEqual({ id: expect.any(String), ...project, image_url: null });
      const older = await appRequest(app, 'post', '/me/projects', sara).send({ ...project, year: 2019, title: 'Expo' });
      const id = created.body.data.id as string;

      const edited = await appRequest(app, 'patch', `/me/projects/${id}`, sara).send({ ...project, role: 'Producer' });
      expectContract(edited, 'patch', '/me/projects/{id}', 200);
      expect(edited.body.data.role).toBe('Producer');

      const profile = await appRequest(app, 'get', '/me/profile', sara);
      expectContract(profile, 'get', '/me/profile', 200);
      expect(profile.body.data.projects.map((p: { id: string }) => p.id)).toEqual([id, older.body.data.id]);

      const removed = await appRequest(app, 'delete', `/me/projects/${id}`, sara);
      expect(removed.status).toBe(204);
      expect((await appRequest(app, 'get', '/me/profile', sara)).body.data.projects).toHaveLength(1);
    });

    it("answers 404 for another member's project and leaves it alone", async () => {
      const created = await appRequest(app, 'post', '/me/projects', sara).send(project);
      const id = created.body.data.id as string;
      expect((await appRequest(app, 'patch', `/me/projects/${id}`, omar).send(project)).status).toBe(404);
      expect((await appRequest(app, 'delete', `/me/projects/${id}`, omar)).status).toBe(404);
      expect((await appRequest(app, 'get', '/me/profile', sara)).body.data.projects).toHaveLength(1);
    });

    it('validates the project', async () => {
      const res = await appRequest(app, 'post', '/me/projects', sara).send({
        year: 1900,
        category: ' ',
        title: 'x'.repeat(201),
        role: 'Producer',
      });
      expect(res.status).toBe(422);
      expect(Object.keys(res.body.errors).sort()).toEqual(['category', 'title', 'year']);
      const future = await appRequest(app, 'post', '/me/projects', sara).send({ ...project, year: 2100 });
      expect(future.body.errors.year).toEqual([expect.stringMatching(/or earlier$/)]);
    });

    it('is for individuals only', async () => {
      const res = await appRequest(app, 'post', '/me/projects', stagecraft).send(project);
      expect({ status: res.status, code: res.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
    });
  });

  describe('/me/skills', () => {
    let rigging: string;
    let lighting: string;
    let retired: string;

    beforeEach(async () => {
      const insert = async (slug: string, en: string, ar: string, active = true) =>
        (
          await admin.query(
            `INSERT INTO app.skills (id, slug, name_en, name_ar, is_active, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, now()) RETURNING id`,
            [slug, en, ar, active],
          )
        ).rows[0].id as string;
      rigging = await insert('rigging', 'Rigging', 'تعليق المعدات');
      lighting = await insert('lighting', 'Lighting', 'الإضاءة');
      retired = await insert('pyro', 'Pyrotechnics', 'الألعاب النارية', false);
    });

    it('replaces the skills in the given order, named in the request language', async () => {
      const res = await appRequest(app, 'put', '/me/skills', sara).send({ skill_ids: [lighting, rigging] });
      expectContract(res, 'put', '/me/skills', 200);
      expect(res.body.data.skills).toEqual(['Lighting', 'Rigging']);

      const ar = await appRequest(app, 'get', '/me/profile', sara, 'ar');
      expect(ar.body.data.skills).toEqual(['الإضاءة', 'تعليق المعدات']);

      const cleared = await appRequest(app, 'put', '/me/skills', sara).send({ skill_ids: [] });
      expect(cleared.body.data.skills).toEqual([]);
    });

    it('refuses unknown, retired and repeated skills', async () => {
      const unknown = await appRequest(app, 'put', '/me/skills', sara).send({
        skill_ids: [rigging, '00000000-0000-7000-8000-000000000000', retired],
      });
      expect(unknown.status).toBe(422);
      expect(unknown.body.errors.skill_ids[0]).toContain(retired);
      const repeated = await appRequest(app, 'put', '/me/skills', sara).send({ skill_ids: [rigging, rigging] });
      expect(repeated.body.errors).toEqual({ skill_ids: ['must not repeat a skill'] });
      expect((await appRequest(app, 'get', '/me/profile', sara)).body.data.skills).toEqual([]);
    });

    it('keeps a skill on the profile after staff retire it', async () => {
      await appRequest(app, 'put', '/me/skills', sara).send({ skill_ids: [rigging] });
      await admin.query(`UPDATE app.skills SET is_active = false WHERE id = $1`, [rigging]);
      expect((await appRequest(app, 'get', '/me/profile', sara)).body.data.skills).toEqual(['Rigging']);
    });
  });

  describe('/companies', () => {
    it('lists companies with paging and finds them by name', async () => {
      await registerAccount(app, { name: 'Zeta Owner', company: { name: 'Zeta Sound', company_type: 'SUPPLIER' } });
      const page1 = await appRequest(app, 'get', '/companies?page=1&page_size=1', sara);
      expectContract(page1, 'get', '/companies', 200);
      expect(page1.body.meta).toEqual({ page: 1, page_size: 1, has_more: true });
      expect(page1.body.data.map((c: { name: string }) => c.name)).toEqual(['Stagecraft Co.']);

      const byType = await appRequest(app, 'get', '/companies?type=SUPPLIER', sara);
      expect(byType.body.data.map((c: { name: string }) => c.name)).toEqual(['Zeta Sound']);
      const byName = await appRequest(app, 'get', '/companies?q=STAGE', sara);
      expect(byName.body.data.map((c: { name: string }) => c.name)).toEqual(['Stagecraft Co.']);
      const picks = await appRequest(app, 'get', '/companies?editors_pick=true', sara);
      expect(picks.body.data).toEqual([]);
    });

    it('shows a company, follows idempotently and unfollows', async () => {
      const path = `/companies/${stagecraft.companyId}`;
      const shown = await appRequest(app, 'get', path, sara);
      expectContract(shown, 'get', '/companies/{id}', 200);
      expect(shown.body.data).toMatchObject({
        name: 'Stagecraft Co.',
        followers: 0,
        followed: false,
        is_verified: false,
      });

      const followed = await appRequest(app, 'put', `${path}/follow`, sara);
      expectContract(followed, 'put', '/companies/{id}/follow', 200);
      expect(followed.body.data).toMatchObject({ followers: 1, followed: true });
      expect((await appRequest(app, 'put', `${path}/follow`, sara)).body.data.followers).toBe(1);
      expect((await appRequest(app, 'put', `${path}/follow`, omar)).body.data).toMatchObject({ followers: 2 });

      const unfollowed = await appRequest(app, 'delete', `${path}/follow`, sara);
      expectContract(unfollowed, 'delete', '/companies/{id}/follow', 200);
      expect(unfollowed.body.data).toMatchObject({ followers: 1, followed: false });
      expect((await appRequest(app, 'delete', `${path}/follow`, sara)).body.data.followers).toBe(1);
    });

    it('answers 404 for an unknown or malformed id', async () => {
      expect((await appRequest(app, 'get', '/companies/00000000-0000-7000-8000-000000000000', sara)).status).toBe(404);
      expect((await appRequest(app, 'get', '/companies/not-an-id', sara)).status).toBe(404);
    });
  });

  describe('/professionals', () => {
    it('lists other individuals, filters students and connects idempotently', async () => {
      const list = await appRequest(app, 'get', '/professionals', sara);
      expectContract(list, 'get', '/professionals', 200);
      expect(list.body.data.map((p: { name: string }) => p.name)).toEqual(['Omar Haddad']);
      expect(list.body.data[0]).toMatchObject({ student: true, connected: false, field: 'OTHER' });

      expect((await appRequest(app, 'get', '/professionals?filter=STUDENTS', omar)).body.data).toEqual([]);
      expect((await appRequest(app, 'get', '/professionals?filter=STUDENTS', sara)).body.data).toHaveLength(1);
      expect((await appRequest(app, 'get', '/professionals?q=omar', sara)).body.data).toHaveLength(1);
      expect((await appRequest(app, 'get', '/professionals?q=nobody', sara)).body.data).toEqual([]);

      const connected = await appRequest(app, 'put', `/professionals/${omar.userId}/connection`, sara);
      expectContract(connected, 'put', '/professionals/{id}/connection', 200);
      expect(connected.body.data.connected).toBe(true);
      expect((await appRequest(app, 'put', `/professionals/${omar.userId}/connection`, sara)).status).toBe(200);

      const withdrawn = await appRequest(app, 'delete', `/professionals/${omar.userId}/connection`, sara);
      expectContract(withdrawn, 'delete', '/professionals/{id}/connection', 200);
      expect(withdrawn.body.data.connected).toBe(false);
    });

    it('does not list or connect to companies or yourself', async () => {
      expect((await appRequest(app, 'put', `/professionals/${stagecraft.userId}/connection`, sara)).status).toBe(404);
      expect((await appRequest(app, 'put', `/professionals/${sara.userId}/connection`, sara)).status).toBe(422);
    });
  });

  describe('/company workspace', () => {
    const project = {
      title: 'Riyadh Season opening',
      description: 'Stage and rigging for the opening night.',
      location: 'Boulevard City, Riyadh',
      category: 'Technical Production',
      started_at: '2026-10-10',
      ended_at: '2026-10-12',
      services: ['Rigging', 'Lighting'],
      client_name: null,
    };

    it('edits the profile, which the directory then shows', async () => {
      const own = await appRequest(app, 'get', '/company', stagecraft);
      expectContract(own, 'get', '/company', 200);

      const update = {
        specialization: 'Staging & Rigging',
        city: 'Riyadh',
        description: 'Stages for festivals.',
        services: ['Rigging', 'Rigging', 'Stages'],
        contact_email: 'Hello@Stagecraft.sa',
        contact_phone: '+966 55 000 1111',
        website: 'https://stagecraft.sa',
      };
      const patched = await appRequest(app, 'patch', '/company', stagecraft).send(update);
      expectContract(patched, 'patch', '/company', 200);
      expect(patched.body.data).toMatchObject({
        name: 'Stagecraft Co.',
        services: ['Rigging', 'Stages'],
        contact_email: 'hello@stagecraft.sa',
        contact_phone: '+966550001111',
      });

      const cleared = await appRequest(app, 'patch', '/company', stagecraft).send({ website: '' });
      expect(cleared.body.data).toMatchObject({ website: null, city: 'Riyadh' });
      const bad = await appRequest(app, 'patch', '/company', stagecraft).send({ name: 'New', contact_email: 'nope' });
      expect(bad.status).toBe(422);
      expect(Object.keys(bad.body.errors).sort()).toEqual(['(body)', 'contact_email']);
    });

    it('creates, lists, edits and deletes projects; the public portfolio follows', async () => {
      const created = await appRequest(app, 'post', '/company/projects', stagecraft).send(project);
      expectContract(created, 'post', '/company/projects', 201);
      const id = created.body.data.id as string;

      const mine = await appRequest(app, 'get', '/company/projects', stagecraft);
      expectContract(mine, 'get', '/company/projects', 200);
      expect(mine.body.data).toHaveLength(1);

      const edited = await appRequest(app, 'patch', `/company/projects/${id}`, stagecraft).send({
        ...project,
        title: 'Riyadh Season opening night',
        ended_at: null,
      });
      expectContract(edited, 'patch', '/company/projects/{id}', 200);
      expect(edited.body.data).toMatchObject({ title: 'Riyadh Season opening night', ended_at: null });

      const portfolio = await appRequest(app, 'get', `/companies/${stagecraft.companyId}/projects`, sara);
      expectContract(portfolio, 'get', '/companies/{id}/projects', 200);
      expect(portfolio.body.data.map((p: { id: string }) => p.id)).toEqual([id]);
      expect(
        (await appRequest(app, 'get', `/companies/${stagecraft.companyId}`, sara)).body.data.completed_projects,
      ).toBe(1);

      const removed = await appRequest(app, 'delete', `/company/projects/${id}`, stagecraft);
      expect(removed.status).toBe(204);
      expect((await appRequest(app, 'get', '/company/projects', stagecraft)).body.data).toEqual([]);
    });

    it('refuses an end date before the start date', async () => {
      const res = await appRequest(app, 'post', '/company/projects', stagecraft).send({
        ...project,
        ended_at: '2026-10-01',
      });
      expect(res.status).toBe(422);
      expect(res.body.errors).toEqual({ ended_at: ['must not be before started_at'] });
    });

    it('counts profile views per viewer per day over 30 days', async () => {
      const path = `/companies/${stagecraft.companyId}`;
      await appRequest(app, 'get', path, sara);
      await appRequest(app, 'get', path, sara);
      await appRequest(app, 'get', path, omar);
      const stats = await appRequest(app, 'get', '/company/stats', stagecraft);
      expectContract(stats, 'get', '/company/stats', 200);
      expect(stats.body.data).toEqual({
        live_listings: 0,
        new_applicants: 0,
        new_applicants_this_week: 0,
        supplier_invites: 0,
        profile_views: 2,
        profile_views_change_percent: null,
      });

      // Four views in the previous 30 days (31 to 59 days ago): 2 now is -50 %.
      const today = new Date(clock.now().getTime() + 3 * 3600_000);
      for (const daysAgo of [30, 40, 50, 59]) {
        await admin.query(
          `INSERT INTO app.company_profile_views (company_id, viewer_user_id, day) VALUES ($1, gen_random_uuid(), $2::date)`,
          [stagecraft.companyId, new Date(today.getTime() - daysAgo * DAY).toISOString().slice(0, 10)],
        );
      }
      await admin.query(
        `INSERT INTO app.company_profile_views (company_id, viewer_user_id, day) VALUES ($1, gen_random_uuid(), $2::date)`,
        [stagecraft.companyId, new Date(today.getTime() - 60 * DAY).toISOString().slice(0, 10)],
      );
      expect((await appRequest(app, 'get', '/company/stats', stagecraft)).body.data).toMatchObject({
        profile_views: 2,
        profile_views_change_percent: -50,
      });
    });
  });
});
