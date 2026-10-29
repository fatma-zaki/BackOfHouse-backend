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
import { permissionsForRole, STAFF_ROLES, StaffRole } from '../../src/modules/access';
import { ADMIN_ACTOR_RESOLVER } from '../../src/surfaces/actor-resolver';
import { buildSurfaceDocuments } from '../../src/surfaces/surface-docs';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { TestHeaderActorResolver } from '../support/test-actors';

const PREFIX = '/api/admin/v1';
const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const SAMPLE_PARAMS: Record<string, string> = {
  id: '0191f0a0-0000-7000-8000-00000000f001',
  kind: 'cities',
  subject: 'users',
  key: 'event_attendance',
};

interface Operation {
  method: (typeof METHODS)[number];
  path: string;
  permission: string;
}

/**
 * Permission matrix (execution-plan.md Phase 2 exit): every admin operation that is
 * implemented and carries `x-permission` in contracts/admin answers 403 for exactly
 * the roles without that key, and something other than 403 for the roles with it.
 * The list comes from the contract and the code, so new operations join automatically.
 */
describe('admin permission matrix (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let operations: Operation[] = [];

  beforeAll(async () => {
    applyTestEnv({ STAFF_GOOGLE_WORKSPACE_DOMAIN: 'backofhouse.test' });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ADMIN_ACTOR_RESOLVER)
      .useClass(TestHeaderActorResolver)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
    admin = await connectAdmin();

    const contract = yaml.load(readFileSync(join(__dirname, '../../contracts/admin/openapi.yaml'), 'utf8')) as {
      paths: Record<string, Record<string, { 'x-permission'?: string }>>;
    };
    const implemented = new Set(
      Object.entries(buildSurfaceDocuments(app).admin.paths).flatMap(([path, item]) =>
        METHODS.filter((m) => (item as Record<string, unknown>)[m]).map((m) => `${m} ${path.slice(PREFIX.length)}`),
      ),
    );
    operations = Object.entries(contract.paths).flatMap(([path, item]) =>
      METHODS.filter((m) => item[m]?.['x-permission'] && implemented.has(`${m} ${path}`)).map((m) => ({
        method: m,
        path,
        permission: item[m]['x-permission']!,
      })),
    );
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  it('covers the Phase 1–2 admin operations', () => {
    expect(operations.map((o) => `${o.method.toUpperCase()} ${o.path}`).sort()).toEqual(
      [
        'DELETE /team/invites/{id}',
        'GET /roles',
        'GET /settings',
        'GET /team',
        'PATCH /team/{id}',
        'POST /team/invites',
        'PUT /settings',
      ].sort(),
    );
  });

  it.each(STAFF_ROLES)('%s gets 403 exactly where it lacks the permission', async (role: StaffRole) => {
    const held = new Set<string>(permissionsForRole(role));
    const mismatches: string[] = [];
    for (const op of operations) {
      const url = PREFIX + op.path.replace(/\{(\w+)\}/g, (_, name: string) => SAMPLE_PARAMS[name] ?? 'x');
      const response = await request(app.getHttpServer())
        [op.method](url)
        .set('x-test-actor', `staff:${role}`)
        .send(op.method === 'get' || op.method === 'delete' ? undefined : {});
      const forbidden = response.status === 403;
      if (forbidden === held.has(op.permission)) {
        mismatches.push(`${op.method.toUpperCase()} ${op.path} (${op.permission}) → ${response.status}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
