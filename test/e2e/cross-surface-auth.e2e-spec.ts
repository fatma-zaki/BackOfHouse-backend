import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import yaml from 'js-yaml';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, CSRF_HEADER, StaffSessionsService } from '../../src/modules/access';
import { TransactionRunner } from '../../src/platform/database';
import { buildSurfaceDocuments } from '../../src/surfaces/surface-docs';
import { SURFACE_PREFIXES } from '../../src/surfaces/surface-paths';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const SAMPLE_ID = '0191f0a0-0000-7000-8000-00000000f001';

interface Operation {
  method: (typeof METHODS)[number];
  path: string;
}

type Contract = { paths: Record<string, Record<string, { security?: unknown[] }>> };

/** Implemented operations of a surface that need a credential, from its contract and the code. */
function protectedOperations(app: NestExpressApplication, surface: 'app' | 'admin'): Operation[] {
  const prefix = SURFACE_PREFIXES[surface];
  const contract = yaml.load(
    readFileSync(join(__dirname, `../../contracts/${surface}/openapi.yaml`), 'utf8'),
  ) as Contract;
  const implemented = new Set(
    Object.entries(buildSurfaceDocuments(app)[surface].paths).flatMap(([path, item]) =>
      METHODS.filter((m) => (item as Record<string, unknown>)[m]).map((m) => `${m} ${path.slice(prefix.length)}`),
    ),
  );
  return Object.entries(contract.paths).flatMap(([path, item]) =>
    METHODS.filter((m) => {
      const op = item[m];
      const isPublic = Array.isArray(op?.security) && op.security.length === 0;
      return op && !isPublic && implemented.has(`${m} ${path}`);
    }).map((method) => ({ method, path: `${prefix}${path.replace(/\{[^}]+\}/g, SAMPLE_ID)}` })),
  );
}

/**
 * Each surface accepts only its own credential (execution-plan.md Phase 2 exit, ADR-031):
 * a member access token gets 401 on every admin route, and a staff session cookie gets
 * 401 on every app route. The route lists come from both contracts.
 */
describe('cross-surface authentication (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let memberToken: string;
  let staffCookie: string;
  let csrf: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    applyTestEnv({ STAFF_GOOGLE_WORKSPACE_DOMAIN: 'backofhouse.test' });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
    admin = await connectAdmin();
    await resetDatabase(admin);

    const registered = await http().post('/api/app/v1/auth/register').send({
      full_name: 'Sara Al-Qahtani',
      email: 'sara@example.com',
      phone: '+966501234567',
      password: 'correct horse',
      account_type: 'INDIVIDUAL',
    });
    expect(registered.status).toBe(201);
    memberToken = registered.body.data.access_token;

    const { rows } = await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES (gen_random_uuid(), 'owner@backofhouse.test', 'Owner', 'SUPER_ADMIN', 'ACTIVE', now(), now()) RETURNING id`,
    );
    const session = await app
      .get(TransactionRunner)
      .run((tx) => app.get(StaffSessionsService).create(tx, rows[0].id as string, {}));
    staffCookie = `${ADMIN_SESSION_COOKIE}=${session.token}; ${ADMIN_CSRF_COOKIE}=${session.csrfToken}`;
    csrf = session.csrfToken;
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  it('has working credentials on their own surfaces', async () => {
    expect((await http().get('/api/app/v1/me').set('Authorization', `Bearer ${memberToken}`)).status).toBe(200);
    expect((await http().get('/api/admin/v1/me').set('Cookie', staffCookie)).status).toBe(200);
  });

  it('refuses a member token on every protected admin route', async () => {
    const operations = protectedOperations(app, 'admin');
    expect(operations.length).toBeGreaterThan(5);
    const accepted: string[] = [];
    for (const { method, path } of operations) {
      const res = await http()[method](path).set('Authorization', `Bearer ${memberToken}`).send({});
      if (res.status !== 401) accepted.push(`${method.toUpperCase()} ${path} → ${res.status}`);
    }
    expect(accepted).toEqual([]);
  });

  it('refuses a staff session cookie on every protected app route', async () => {
    const operations = protectedOperations(app, 'app');
    expect(operations.map((o) => `${o.method} ${o.path}`)).toEqual(
      expect.arrayContaining(['get /api/app/v1/me', 'post /api/app/v1/auth/logout']),
    );
    const accepted: string[] = [];
    for (const { method, path } of operations) {
      const res = await http()[method](path).set('Cookie', staffCookie).set(CSRF_HEADER, csrf).send({});
      if (res.status !== 401) accepted.push(`${method.toUpperCase()} ${path} → ${res.status}`);
    }
    expect(accepted).toEqual([]);
  });
});
