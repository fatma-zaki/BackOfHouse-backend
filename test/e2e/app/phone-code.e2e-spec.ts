import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { CLOCK } from '../../../src/common/clock/clock';
import { AppConfig } from '../../../src/config/app.config';
import { configureHttpApp } from '../../../src/http-app';
import {
  DevSmsSender,
  InMemoryMemberAuthProvider,
  MEMBER_AUTH_PROVIDER,
  PHONE_CODE,
  SMS_SENDER,
} from '../../../src/modules/identity';
import { applyTestEnv, connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';

const PHONE = '+966501234567';
const SECOND = 1000;

/** contracts/app /auth/phone/code and /auth/phone/verify (BQ-78). */
describe('Phone code sign-in (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let sms: DevSmsSender;
  let provider: InMemoryMemberAuthProvider;
  let clock: FakeClock;
  let ipCounter = 0;
  let clientIp = '';
  const http = () => request(app.getHttpServer());
  const post = (path: string, body: object, ip = clientIp) =>
    http().post(`/api/app/v1${path}`).set('X-Forwarded-For', ip).send(body);
  const sendCode = (phone = PHONE, ip = clientIp) => post('/auth/phone/code', { phone }, ip);
  const verify = (code: string, phone = PHONE) => post('/auth/phone/verify', { phone, code });
  const lastCode = () => /\b(\d{6})\b/.exec(sms.sent.at(-1)!.text)![1];
  const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

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
    sms = app.get(SMS_SENDER);
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
    sms.sent.length = 0;
    ipCounter += 1;
    clientIp = `10.2.0.${ipCounter}`;
    // A fresh hour for every test, so the per-phone window starts empty.
    clock.advance(2 * 3600 * SECOND);
    const registered = await post('/auth/register', {
      full_name: 'Sara Al-Qahtani',
      email: 'sara@example.com',
      phone: PHONE,
      password: 'correct horse',
      account_type: 'INDIVIDUAL',
    });
    expect(registered.status).toBe(201);
  });

  it('signs in with the texted code, in the request language, and marks the phone verified', async () => {
    const sent = await http()
      .post('/api/app/v1/auth/phone/code')
      .set('X-Forwarded-For', clientIp)
      .set('Accept-Language', 'ar')
      .send({ phone: '+966 50 123 4567' });
    expect(sent.status).toBe(204);
    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0].phone).toBe(PHONE);
    expect(sms.sent[0].text).toContain('رمز الدخول');

    const res = await verify(lastCode());
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ phone: PHONE, email: 'sara@example.com' });
    const me = await http().get('/api/app/v1/me').set('Authorization', `Bearer ${res.body.data.access_token}`);
    expect(me.status).toBe(200);
    const { rows } = await admin.query(`SELECT phone_verified_at IS NOT NULL AS verified FROM app.users`);
    expect(rows).toEqual([{ verified: true }]);
    const { rows: codes } = await admin.query(`SELECT code_hash <> $1 AS hashed FROM app.phone_sign_in_codes`, [
      lastCode(),
    ]);
    expect(codes).toEqual([{ hashed: true }]);
  });

  it('uses a code once', async () => {
    await sendCode();
    const code = lastCode();
    expect((await verify(code)).status).toBe(200);
    const again = await verify(code);
    expect([again.status, again.body.code]).toEqual([422, 'INVALID_CODE']);
  });

  it('answers 422 INVALID_CODE for a wrong code', async () => {
    await sendCode();
    const res = await verify(wrong(lastCode()));
    expect([res.status, res.body.code]).toEqual([422, 'INVALID_CODE']);
  });

  it('burns the code at the attempt cap: then 429 RATE_LIMITED, even with the right code', async () => {
    await sendCode();
    const code = lastCode();
    for (let i = 0; i < PHONE_CODE.maxAttempts; i += 1) {
      expect((await verify(wrong(code))).status).toBe(422);
    }
    const blocked = await verify(code);
    expect([blocked.status, blocked.body.code]).toEqual([429, 'RATE_LIMITED']);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThanOrEqual(1);

    clock.advance(PHONE_CODE.resendAfterSeconds * SECOND);
    await sendCode();
    expect((await verify(lastCode())).status).toBe(200);
  });

  it('answers 422 INVALID_CODE for an expired code', async () => {
    await sendCode();
    clock.advance((PHONE_CODE.ttlSeconds + 1) * SECOND);
    const res = await verify(lastCode());
    expect([res.status, res.body.code]).toEqual([422, 'INVALID_CODE']);
  });

  it('replaces the previous code when a new one is sent', async () => {
    await sendCode();
    const first = lastCode();
    clock.advance(PHONE_CODE.resendAfterSeconds * SECOND);
    await sendCode();
    const second = lastCode();
    if (first !== second) expect((await verify(first)).status).toBe(422);
    expect((await verify(second)).status).toBe(200);
  });

  it('waits between codes and caps codes per phone number per hour (429 with Retry-After)', async () => {
    expect((await sendCode()).status).toBe(204);
    const tooSoon = await sendCode();
    expect([tooSoon.status, tooSoon.body.code]).toEqual([429, 'RATE_LIMITED']);
    expect(Number(tooSoon.headers['retry-after'])).toBe(PHONE_CODE.resendAfterSeconds);

    for (let i = 1; i < PHONE_CODE.maxPerPhonePerHour; i += 1) {
      clock.advance(PHONE_CODE.resendAfterSeconds * SECOND);
      // From a new address each time, so only the per-phone limit applies.
      expect((await sendCode(PHONE, `10.3.${ipCounter}.${i}`)).status).toBe(204);
    }
    clock.advance(PHONE_CODE.resendAfterSeconds * SECOND);
    const capped = await sendCode(PHONE, `10.3.${ipCounter}.99`);
    expect([capped.status, capped.body.code]).toEqual([429, 'RATE_LIMITED']);
    expect(sms.sent).toHaveLength(PHONE_CODE.maxPerPhonePerHour);
  });

  it('limits requests per IP (429 RATE_LIMITED); the hourly per-IP cap is in phone-sign-in.int-spec', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await sendCode(`+9665500000${String(i).padStart(2, '0')}`)).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 204)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it('answers 204 for a number without an account and sends nothing', async () => {
    const res = await sendCode('+966599999999');
    expect(res.status).toBe(204);
    expect(sms.sent).toHaveLength(0);
    const verifyRes = await verify('123456', '+966599999999');
    expect([verifyRes.status, verifyRes.body.code]).toEqual([422, 'INVALID_CODE']);
  });

  it('refuses a malformed number with 422 and a malformed code with 422', async () => {
    const badPhone = await sendCode('0501234567');
    expect([badPhone.status, badPhone.body.code]).toEqual([422, 'VALIDATION_FAILED']);
    const badCode = await verify('12ab56');
    expect([badCode.status, badCode.body.code]).toEqual([422, 'VALIDATION_FAILED']);
  });
});
