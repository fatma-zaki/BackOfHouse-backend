import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CLOCK } from '../../src/common/clock/clock';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { applyTestEnv } from './database';
import { FakeClock } from './fake-staff-idp';

export const APP_PREFIX = '/api/app/v1';

/** The whole api process over HTTP, with a fake clock (e2e and HTTP-level integration tests). */
export async function bootApp(): Promise<{ app: NestExpressApplication; clock: FakeClock }> {
  applyTestEnv();
  const clock = new FakeClock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CLOCK)
    .useValue(clock)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureHttpApp(app, app.get(AppConfig));
  app.set('trust proxy', true); // test only: each registration uses its own client IP
  await app.init();
  return { app, clock };
}

export interface RegisteredAccount {
  token: string;
  userId: string;
  email: string;
  phone: string;
  companyId: string | null;
}

let counter = 0;

/** Registers through POST /auth/register and returns the access token and ids. */
export async function registerAccount(
  app: NestExpressApplication,
  options: {
    name: string;
    company?: { name: string; company_type: string };
    profileStatus?: 'PROFESSIONAL' | 'STUDENT';
    locale?: 'ar' | 'en';
  },
): Promise<RegisteredAccount> {
  counter += 1;
  const email = `member${counter}@example.com`;
  const phone = `+9665${String(10_000_000 + counter).slice(-8)}`;
  const res = await request(app.getHttpServer())
    .post(`${APP_PREFIX}/auth/register`)
    .set('Accept-Language', options.locale ?? 'en')
    .set('X-Forwarded-For', `10.77.${Math.floor(counter / 250)}.${counter % 250}`)
    .send({
      full_name: options.name,
      email,
      phone,
      password: 'password-123',
      account_type: options.company ? 'COMPANY' : 'INDIVIDUAL',
      ...(options.company ? { company: options.company } : {}),
      ...(options.profileStatus ? { profile_status: options.profileStatus } : {}),
    });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  const user = res.body.data.user;
  return {
    token: res.body.data.access_token,
    userId: user.id,
    email,
    phone,
    companyId: user.membership?.company.id ?? null,
  };
}

/** A request to the app surface as `account` (or anonymous). */
export function appRequest(
  app: NestExpressApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  account?: { token: string },
  locale: 'ar' | 'en' = 'en',
) {
  const req = request(app.getHttpServer())[method](`${APP_PREFIX}${path}`).set('Accept-Language', locale);
  return account ? req.set('Authorization', `Bearer ${account.token}`) : req;
}
