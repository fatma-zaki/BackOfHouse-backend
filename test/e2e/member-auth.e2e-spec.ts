import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CLOCK } from '../../src/common/clock/clock';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { InMemoryMemberAuthProvider, MEMBER_AUTH_PROVIDER } from '../../src/modules/identity';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { FakeClock } from '../support/fake-staff-idp';

const MINUTE = 60_000;

/** contracts/app /auth/* (email + password) and GET /me; ADR-003 amended, BQ-78, BQ-79. */
describe('Member sign-in (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let provider: InMemoryMemberAuthProvider;
  let clock: FakeClock;
  let ipCounter = 0;
  let clientIp = '';
  const http = () => request(app.getHttpServer());
  const post = (path: string, body: object) =>
    http().post(`/api/app/v1${path}`).set('X-Forwarded-For', clientIp).send(body);
  const me = (token: string) => http().get('/api/app/v1/me').set('Authorization', `Bearer ${token}`);

  const individual = {
    full_name: 'Sara Al-Qahtani',
    email: 'Sara@Example.com',
    phone: '+966 50 123 4567',
    password: 'correct horse',
    account_type: 'INDIVIDUAL',
  };
  const company = {
    full_name: 'Omar Haddad',
    email: 'omar@stagecraft.sa',
    phone: '+966551112222',
    password: 'battery staple',
    account_type: 'COMPANY',
    company: { name: 'Stagecraft Co.', company_type: 'PRODUCTION' },
  };

  beforeAll(async () => {
    applyTestEnv();
    clock = new FakeClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    app.set('trust proxy', true); // test only: lets each test choose its client IP
    await app.init();
    provider = app.get(MEMBER_AUTH_PROVIDER);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    provider.clear();
    ipCounter += 1;
    clientIp = `10.1.0.${ipCounter}`;
  });

  it('registers an individual (PROFESSIONAL by default) and restores the session with GET /me', async () => {
    const res = await post('/auth/register', individual);
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      expires_in: 600,
      user: {
        id: expect.any(String),
        full_name: 'Sara Al-Qahtani',
        email: 'sara@example.com',
        phone: '+966501234567',
        account_type: 'INDIVIDUAL',
        profile_status: 'PROFESSIONAL',
        headline: null,
        avatar_url: null,
        is_verified: false,
        membership: null,
      },
    });
    const restored = await me(res.body.data.access_token);
    expect(restored.status).toBe(200);
    expect(restored.body.data).toEqual(res.body.data.user);
    const audit = await admin.query(`SELECT action, entity_id FROM app.audit_logs`);
    expect(audit.rows).toEqual([{ action: 'user.register', entity_id: res.body.data.user.id }]);
  });

  it('keeps students as individuals with profile_status STUDENT (BQ-79)', async () => {
    const res = await post('/auth/register', { ...individual, profile_status: 'STUDENT' });
    expect(res.body.data.user).toMatchObject({ account_type: 'INDIVIDUAL', profile_status: 'STUDENT' });
  });

  it('registers a company with this account as its OWNER (ADR-030)', async () => {
    const res = await post('/auth/register', company);
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      account_type: 'COMPANY',
      profile_status: null,
      is_verified: false,
      membership: {
        company: {
          id: expect.any(String),
          name: 'Stagecraft Co.',
          company_type: 'PRODUCTION',
          logo_url: null,
          is_verified: false,
          capabilities: [],
        },
        role: 'OWNER',
        permissions: [
          'EDIT_PROFILE',
          'MANAGE_PROJECTS',
          'MANAGE_OPPORTUNITIES',
          'REVIEW_APPLICANTS',
          'RESPOND_TO_SUPPLIER_REQUESTS',
        ],
      },
    });
    const { rows } = await admin.query(`SELECT account_user_id, status FROM app.companies`);
    expect(rows).toEqual([{ account_user_id: res.body.data.user.id, status: 'DRAFT' }]);
  });

  it.each([
    ['no company for a company account', { ...company, company: undefined }, 'company'],
    ['a company on an individual account', { ...individual, company: company.company }, 'company'],
    ['profile_status on a company account', { ...company, profile_status: 'STUDENT' }, 'profile_status'],
    ['a local phone number', { ...individual, phone: '0501234567' }, 'phone'],
    ['a short password', { ...individual, password: 'short' }, 'password'],
    ['an unknown account type', { ...individual, account_type: 'SUPPLIER' }, 'account_type'],
  ])('refuses %s with 422', async (_label, body, field) => {
    const res = await post('/auth/register', body);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors)).toContain(field);
    expect((await admin.query(`SELECT count(*)::int AS n FROM app.users`)).rows[0].n).toBe(0);
  });

  it('refuses an email or phone already in use with 409 EMAIL_TAKEN / PHONE_TAKEN', async () => {
    await post('/auth/register', individual);
    const sameEmail = await post('/auth/register', { ...company, email: 'SARA@example.com' });
    expect([sameEmail.status, sameEmail.body.code]).toEqual([409, 'EMAIL_TAKEN']);
    const samePhone = await post('/auth/register', { ...company, phone: '00966501234567' });
    expect([samePhone.status, samePhone.body.code]).toEqual([409, 'PHONE_TAKEN']);
    expect((await admin.query(`SELECT count(*)::int AS n FROM app.companies`)).rows[0].n).toBe(0);
  });

  it('signs in with email and password; a wrong password is 401 INVALID_CREDENTIALS', async () => {
    await post('/auth/register', individual);
    const ok = await post('/auth/login', { email: 'sara@example.com', password: 'correct horse' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe('sara@example.com');

    for (const body of [
      { email: 'sara@example.com', password: 'wrong horse' },
      { email: 'nobody@example.com', password: 'correct horse' },
    ]) {
      const bad = await post('/auth/login', body);
      expect([bad.status, bad.body.code]).toEqual([401, 'INVALID_CREDENTIALS']);
    }
  });

  it('refuses sign-in and existing tokens of a suspended account', async () => {
    const { body } = await post('/auth/register', individual);
    await admin.query(`UPDATE app.users SET status = 'SUSPENDED', suspended_at = now()`);
    expect((await me(body.data.access_token)).status).toBe(401);
    const login = await post('/auth/login', { email: individual.email, password: individual.password });
    expect(login.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('refreshes with a rotating refresh token; an old or unknown one is 401', async () => {
    const { body } = await post('/auth/register', individual);
    const refreshed = await post('/auth/refresh', { refresh_token: body.data.refresh_token });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.access_token).not.toBe(body.data.access_token);
    expect((await me(refreshed.body.data.access_token)).status).toBe(200);
    expect((await post('/auth/refresh', { refresh_token: body.data.refresh_token })).status).toBe(401);
    expect((await post('/auth/refresh', { refresh_token: 'nope' })).status).toBe(401);
  });

  it('ends the session on logout: its access token is refused at once', async () => {
    const { body } = await post('/auth/register', individual);
    const token = body.data.access_token;
    const out = await http()
      .post('/api/app/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', clientIp);
    expect(out.status).toBe(204);
    expect((await me(token)).status).toBe(401);
    expect((await post('/auth/refresh', { refresh_token: body.data.refresh_token })).status).toBe(401);
    expect((await http().post('/api/app/v1/auth/logout')).status).toBe(401);
  });

  it('expires access tokens', async () => {
    const { body } = await post('/auth/register', individual);
    clock.advance(11 * MINUTE);
    expect((await me(body.data.access_token)).status).toBe(401);
  });

  it('resets a password from the emailed link and ends every session', async () => {
    const { body } = await post('/auth/register', individual);
    const unknown = await post('/auth/forgot-password', { email: 'nobody@example.com' });
    expect(unknown.status).toBe(204);
    expect((await post('/auth/forgot-password', { email: 'SARA@example.com' })).status).toBe(204);
    const link = provider.sentResetLinks.find((l) => l.email === 'sara@example.com');
    expect(link).toBeDefined();
    expect(provider.sentResetLinks.some((l) => l.email === 'nobody@example.com')).toBe(false);

    clock.advance(1000);
    const reset = await post('/auth/reset-password', { token: link!.token, password: 'new password!' });
    expect(reset.status).toBe(204);
    expect((await me(body.data.access_token)).status).toBe(401);
    expect((await post('/auth/login', { email: individual.email, password: individual.password })).status).toBe(401);
    expect((await post('/auth/login', { email: individual.email, password: 'new password!' })).status).toBe(200);

    const again = await post('/auth/reset-password', { token: link!.token, password: 'another one' });
    expect([again.status, again.body.code]).toEqual([422, 'VALIDATION_FAILED']);
  });

  it('answers 401 on GET /me without a valid Bearer token', async () => {
    expect((await http().get('/api/app/v1/me')).status).toBe(401);
    expect((await me('dev.not-a-token')).status).toBe(401);
    const { body } = await post('/auth/register', individual);
    const asCookie = await http().get('/api/app/v1/me').set('Cookie', `token=${body.data.access_token}`);
    expect(asCookie.status).toBe(401);
  });

  it('limits sign-in attempts per IP (429 RATE_LIMITED)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await post('/auth/login', { email: 'x@example.com', password: 'whatever1' })).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it('counts activity once per Riyadh day', async () => {
    const { body } = await post('/auth/register', individual);
    for (let i = 0; i < 5; i += 1) await me(body.data.access_token);
    const { rows } = await admin.query(`SELECT day::text FROM app.user_activity_days`);
    expect(rows).toEqual([{ day: '2026-10-29' }]);
  });
});
