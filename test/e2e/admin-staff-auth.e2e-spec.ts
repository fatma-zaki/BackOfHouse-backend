import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { CLOCK } from '../../src/common/clock/clock';
import { STAFF_IDENTITY_PROVIDER } from '../../src/modules/access';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { FakeClock, FakeStaffIdp } from '../support/fake-staff-idp';

const DOMAIN = 'backofhouse.test';
const ADMIN_WEB = 'https://admin.backofhouse.test';
const MINUTE = 60_000;

interface SignedIn {
  cookie: string;
  csrf: string;
  location: string;
  setCookie: string[];
}

describe('Staff sign-in with Google Workspace and admin sessions (e2e, ADR-032)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let idp: FakeStaffIdp;
  let clock: FakeClock;
  let codeCounter = 0;
  /** Each test signs in from its own address, so the per-IP sign-in limit (20/min) applies per test. */
  let clientIp = '';
  let ipCounter = 0;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    applyTestEnv({
      STAFF_GOOGLE_WORKSPACE_DOMAIN: DOMAIN,
      STAFF_OIDC_CLIENT_ID: 'client',
      STAFF_OIDC_CLIENT_SECRET: 'secret',
      STAFF_OIDC_REDIRECT_URI: 'https://api.backofhouse.test/api/admin/v1/auth/oidc/callback',
      ADMIN_WEB_URL: ADMIN_WEB,
    });
    idp = new FakeStaffIdp();
    clock = new FakeClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STAFF_IDENTITY_PROVIDER)
      .useValue(idp)
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    app.set('trust proxy', true); // test only: lets each test choose its client IP
    await app.init();
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    ipCounter += 1;
    clientIp = `10.0.0.${ipCounter}`;
  });

  const staff = async (email: string, role = 'SUPER_ADMIN', status = 'ACTIVE'): Promise<string> => {
    const { rows } = await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, disabled_at, updated_at)
       VALUES (gen_random_uuid(), $1, $1, $2::app.staff_role, $3::app.staff_status,
               CASE WHEN $3::text = 'ACTIVE' THEN now() END, CASE WHEN $3::text = 'DISABLED' THEN now() END, now())
       RETURNING id`,
      [email, role, status],
    );
    return rows[0].id as string;
  };

  /** start → (Google) → callback; returns the cookies the admin web app would hold. */
  const signIn = async (claims: Record<string, unknown>, returnTo = '/team') => {
    const start = await http()
      .get(`/api/admin/v1/auth/oidc/start?return_to=${encodeURIComponent(returnTo)}`)
      .set('X-Forwarded-For', clientIp);
    expect(start.status).toBe(302);
    const state = new URL(start.headers.location).searchParams.get('state')!;
    const code = `code-${(codeCounter += 1)}`;
    idp.willReturn(code, claims);
    const response = await http()
      .get(`/api/admin/v1/auth/oidc/callback?code=${code}&state=${state}`)
      .set('X-Forwarded-For', clientIp);
    return { response, state, code };
  };

  const signedIn = async (email: string): Promise<SignedIn> => {
    const { response } = await signIn({ email, hd: DOMAIN });
    expect(response.status).toBe(302);
    const setCookie = response.headers['set-cookie'] as unknown as string[];
    const value = (name: string) => setCookie.find((c) => c.startsWith(`${name}=`))!.split(';')[0];
    return {
      cookie: `${value('__Host-boh_admin')}; ${value('__Host-boh_csrf')}`,
      csrf: value('__Host-boh_csrf').split('=')[1],
      location: response.headers.location,
      setCookie,
    };
  };

  const auditActions = async () =>
    (await admin.query(`SELECT action FROM app.audit_logs ORDER BY occurred_at`)).rows.map((r) => r.action);

  describe('sign-in', () => {
    it('activates an invited Super admin on first sign-in and sets hardened cookies', async () => {
      await staff(`owner@${DOMAIN}`, 'SUPER_ADMIN', 'INVITED');
      const session = await signedIn(`Owner@${DOMAIN}`);

      expect(session.location).toBe(`${ADMIN_WEB}/team`);
      const sessionCookie = session.setCookie.find((c) => c.startsWith('__Host-boh_admin='))!;
      expect(sessionCookie).toMatch(/HttpOnly/i);
      expect(sessionCookie).toMatch(/Secure/i);
      expect(sessionCookie).toMatch(/SameSite=Strict/i);
      expect(sessionCookie).toMatch(/Path=\//);
      expect(session.setCookie.find((c) => c.startsWith('__Host-boh_csrf='))).not.toMatch(/HttpOnly/i);

      const me = await http().get('/api/admin/v1/me').set('Cookie', session.cookie);
      expect(me.status).toBe(200);
      expect(me.body.data).toMatchObject({ email: `owner@${DOMAIN}`, role: 'SUPER_ADMIN', home: 'overview' });
      expect(me.body.data.permissions).toContain('team.manage');
      expect((await admin.query(`SELECT status FROM app.staff_accounts`)).rows).toEqual([{ status: 'ACTIVE' }]);
      expect(await auditActions()).toEqual(['admin.sign_in']);
    });

    it.each([
      ['another Workspace (hd)', { email: `x@${DOMAIN}`, hd: 'other.test' }],
      ['a consumer account (no hd)', { email: `x@${DOMAIN}` }],
      ['the right hd but another email domain', { email: 'x@other.test', hd: DOMAIN }],
      ['an unverified email', { email: `x@${DOMAIN}`, hd: DOMAIN, email_verified: false }],
      ['no staff account', { email: `nobody@${DOMAIN}`, hd: DOMAIN }],
    ])('refuses %s with 403 NOT_STAFF and audits it', async (_label, claims) => {
      await staff(`x@${DOMAIN}`);
      const { response } = await signIn(claims);
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('NOT_STAFF');
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(await auditActions()).toEqual(['admin.sign_in_denied']);
    });

    it('refuses a disabled staff account', async () => {
      await staff(`gone@${DOMAIN}`, 'REVIEWER', 'DISABLED');
      const { response } = await signIn({ email: `gone@${DOMAIN}`, hd: DOMAIN });
      expect(response.body.code).toBe('NOT_STAFF');
    });

    it('uses each state once and checks the nonce', async () => {
      await staff(`owner@${DOMAIN}`);
      const first = await signIn({ email: `owner@${DOMAIN}`, hd: DOMAIN });
      expect(first.response.status).toBe(302);
      const replay = await http().get(`/api/admin/v1/auth/oidc/callback?code=${first.code}&state=${first.state}`);
      expect(replay.status).toBe(401);

      const badNonce = await signIn({ email: `owner@${DOMAIN}`, hd: DOMAIN, nonce: 'attacker-nonce' });
      expect(badNonce.response.status).toBe(401);
    });

    it('limits sign-in attempts to 20 a minute per IP (429)', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 21; i += 1) {
        statuses.push((await http().get('/api/admin/v1/auth/oidc/start').set('X-Forwarded-For', clientIp)).status);
      }
      expect(statuses.slice(0, 20).every((s) => s === 302)).toBe(true);
      expect(statuses[20]).toBe(429);
    });

    it('never redirects off the admin web app (return_to)', async () => {
      await staff(`owner@${DOMAIN}`);
      for (const returnTo of ['//evil.example/x', 'https://evil.example', '/\\evil.example']) {
        const { response } = await signIn({ email: `owner@${DOMAIN}`, hd: DOMAIN }, returnTo);
        expect(response.headers.location).toBe(`${ADMIN_WEB}/`);
      }
    });
  });

  describe('session', () => {
    it('expires after 30 idle minutes, and activity keeps it alive', async () => {
      await staff(`owner@${DOMAIN}`);
      const session = await signedIn(`owner@${DOMAIN}`);
      clock.advance(29 * MINUTE);
      expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(200);
      clock.advance(29 * MINUTE);
      expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(200);
      clock.advance(30 * MINUTE + 1000);
      expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(401);
    });

    it('ends after 12 hours even with activity', async () => {
      await staff(`owner@${DOMAIN}`);
      const session = await signedIn(`owner@${DOMAIN}`);
      for (let elapsed = 0; elapsed < 12 * 60; elapsed += 20) {
        clock.advance(20 * MINUTE);
        if (elapsed + 20 >= 12 * 60) break;
        expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(200);
      }
      expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(401);
    });

    it('requires the CSRF token on writes', async () => {
      await staff(`owner@${DOMAIN}`);
      const session = await signedIn(`owner@${DOMAIN}`);
      const body = { name: 'Reem', email: `reem@${DOMAIN}`, role: 'REVIEWER' };

      const without = await http().post('/api/admin/v1/team/invites').set('Cookie', session.cookie).send(body);
      expect(without.status).toBe(403);
      expect(without.body.code).toBe('CSRF_TOKEN_INVALID');
      const wrong = await http()
        .post('/api/admin/v1/team/invites')
        .set('Cookie', session.cookie)
        .set('X-CSRF-Token', 'guess')
        .send(body);
      expect(wrong.body.code).toBe('CSRF_TOKEN_INVALID');

      const ok = await http()
        .post('/api/admin/v1/team/invites')
        .set('Cookie', session.cookie)
        .set('X-CSRF-Token', session.csrf)
        .send(body);
      expect(ok.status).toBe(201);
      expect(ok.body.data).toMatchObject({ email: `reem@${DOMAIN}`, status: 'INVITED' });
    });

    it('ends a staff member’s sessions when their role changes', async () => {
      await staff(`owner@${DOMAIN}`);
      const reviewerId = await staff(`rev@${DOMAIN}`, 'REVIEWER');
      const owner = await signedIn(`owner@${DOMAIN}`);
      const reviewer = await signedIn(`rev@${DOMAIN}`);
      expect((await http().get('/api/admin/v1/me').set('Cookie', reviewer.cookie)).status).toBe(200);

      const patched = await http()
        .patch(`/api/admin/v1/team/${reviewerId}`)
        .set('Cookie', owner.cookie)
        .set('X-CSRF-Token', owner.csrf)
        .send({ role: 'EDITOR' });
      expect(patched.status).toBe(200);
      expect((await http().get('/api/admin/v1/me').set('Cookie', reviewer.cookie)).status).toBe(401);
    });

    it('signs out: 204, cookies cleared, the old cookie no longer works', async () => {
      await staff(`owner@${DOMAIN}`);
      const session = await signedIn(`owner@${DOMAIN}`);
      const out = await http()
        .post('/api/admin/v1/auth/logout')
        .set('Cookie', session.cookie)
        .set('X-CSRF-Token', session.csrf);
      expect(out.status).toBe(204);
      expect((out.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/__Host-boh_admin=;/);
      expect((await http().get('/api/admin/v1/me').set('Cookie', session.cookie)).status).toBe(401);
      expect(await auditActions()).toEqual(['admin.sign_in', 'admin.sign_out']);
    });

    it('accepts no bearer token on the admin surface and no admin cookie on the app surface', async () => {
      await staff(`owner@${DOMAIN}`);
      const session = await signedIn(`owner@${DOMAIN}`);
      expect((await http().get('/api/admin/v1/me').set('Authorization', 'Bearer anything')).status).toBe(401);
      expect((await http().get('/api/app/v1/meta/app-version?platform=IOS').set('Cookie', session.cookie)).status).toBe(
        200,
      );
    });
  });

  it('refuses removing the last active Super admin over HTTP (409)', async () => {
    const ownerId = await staff(`owner@${DOMAIN}`);
    const session = await signedIn(`owner@${DOMAIN}`);
    const response = await http()
      .patch(`/api/admin/v1/team/${ownerId}`)
      .set('Cookie', session.cookie)
      .set('X-CSRF-Token', session.csrf)
      .send({ status: 'DISABLED' });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('LAST_SUPER_ADMIN');
  });
});
