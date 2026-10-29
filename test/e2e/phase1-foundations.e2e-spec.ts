import { Body, Controller, Get, HttpCode, Module, Param, Post } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { Public } from '../../src/common/decorators/public.decorator';
import { CurrentActor } from '../../src/common/decorators/current-actor.decorator';
import { RequestContext } from '../../src/common/context/request-context';
import type { Actor } from '../../src/common/context/actor';
import { Idempotent } from '../../src/platform/idempotency';
import { TransactionRunner } from '../../src/platform/database';
import { AuditLogger, auditActorOf } from '../../src/modules/audit';
import { ADMIN_ACTOR_RESOLVER, APP_ACTOR_RESOLVER } from '../../src/surfaces/actor-resolver';
import { RequirePermission } from '../../src/surfaces/admin/require-permission.decorator';
import { AuditRead } from '../../src/surfaces/audit-read';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { TestHeaderActorResolver, TEST_STAFF_ID } from '../support/test-actors';

const DOC_ID = '0191f0a0-0000-7000-8000-00000000d001';

/** Test-only routes under the app surface (the route check refuses anything else). */
@Controller('__probe')
class AppProbeController {
  calls = 0;

  @Public()
  @Post('idempotent')
  @HttpCode(201)
  @Idempotent()
  create(@Body() body: Record<string, unknown>): { call: number; body: Record<string, unknown> } {
    this.calls += 1;
    return { call: this.calls, body };
  }

  /** Needs an app credential (member or company). */
  @Get('protected')
  protectedRoute(): { ok: boolean } {
    return { ok: true };
  }

  @Public()
  @Get('locale')
  locale(): { locale: string } {
    return { locale: RequestContext.locale() };
  }
}

@Module({ controllers: [AppProbeController] })
class AppProbeModule {}

/** Test-only routes under the admin surface. */
@Controller('__probe')
class AdminProbeController {
  constructor(
    private readonly audit: AuditLogger,
    private readonly transactions: TransactionRunner,
  ) {}

  @Get('documents/:id')
  @RequirePermission('verification.view')
  @AuditRead({ action: 'verification.document.view', entityType: 'verification_document' })
  document(@Param('id') id: string): { id: string; url: string } {
    return { id, url: 'https://storage.example/signed' };
  }

  @Post('unaudited')
  @RequirePermission('settings.manage')
  unaudited(): { ok: boolean } {
    return { ok: true };
  }

  @Post('audited')
  @RequirePermission('settings.manage')
  async audited(@CurrentActor() actor: Actor): Promise<{ ok: boolean }> {
    await this.transactions.run(() =>
      this.audit.record({ actor: auditActorOf(actor), action: 'probe.write', entityType: 'probe', entityId: DOC_ID }),
    );
    return { ok: true };
  }
}

@Module({ controllers: [AdminProbeController] })
class AdminProbeModule {}

describe('Phase 1A foundations (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  const http = () => request(app.getHttpServer());
  const asSuperAdmin = { 'x-test-actor': 'staff:SUPER_ADMIN' };

  beforeAll(async () => {
    applyTestEnv();
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        AppProbeModule,
        AdminProbeModule,
        RouterModule.register([
          { path: 'app/v1', module: AppProbeModule },
          { path: 'admin/v1', module: AdminProbeModule },
        ]),
      ],
    })
      .overrideProvider(ADMIN_ACTOR_RESOLVER)
      .useClass(TestHeaderActorResolver)
      .overrideProvider(APP_ACTOR_RESOLVER)
      .useClass(TestHeaderActorResolver)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  const auditRows = async () =>
    (await admin.query('SELECT action, actor_type, actor_user_id, entity_id FROM app.audit_logs ORDER BY occurred_at'))
      .rows;

  describe('surface auth and permissions', () => {
    it.each([
      ['no credential', {}, 401, 'UNAUTHENTICATED'],
      ['a member token on the admin surface', { 'x-test-actor': 'member' }, 401, 'UNAUTHENTICATED'],
      ['a Reviewer (no settings.view)', { 'x-test-actor': 'staff:REVIEWER' }, 403, 'FORBIDDEN'],
    ])('GET /admin/v1/settings with %s → %s', async (_label, headers, status, code) => {
      const response = await http().get('/api/admin/v1/settings').set(headers);
      expect(response.status).toBe(status);
      expect(response.body.code).toBe(code);
    });

    it('a staff actor on the app surface is not accepted; a member is', async () => {
      expect((await http().get('/api/app/v1/__probe/protected').set(asSuperAdmin)).status).toBe(401);
      expect((await http().get('/api/app/v1/__probe/protected').set({ 'x-test-actor': 'member' })).status).toBe(200);
    });
  });

  describe('platform settings (contracts/admin GET/PUT /settings)', () => {
    it('Super admin reads defaults, updates them, and the app-version endpoint follows', async () => {
      const current = await http().get('/api/admin/v1/settings').set(asSuperAdmin);
      expect(current.status).toBe(200);
      expect(current.body.data).toMatchObject({ review_sla_hours: 24, verified_companies_skip_review: false });

      const next = {
        ...current.body.data,
        app_version: {
          ...current.body.data.app_version,
          ios: {
            min_supported_version: '1.2.0',
            latest_version: '1.4.0',
            update_url: 'https://apps.apple.com/app/id1',
          },
        },
      };
      const updated = await http().put('/api/admin/v1/settings').set(asSuperAdmin).send(next);
      expect(updated.status).toBe(200);
      expect(updated.body.data.app_version.ios.latest_version).toBe('1.4.0');
      expect(await auditRows()).toEqual([
        { action: 'settings.update', actor_type: 'STAFF', actor_user_id: TEST_STAFF_ID, entity_id: expect.any(String) },
      ]);

      const version = await http().get('/api/app/v1/meta/app-version?platform=IOS');
      expect(version.body).toEqual({
        data: {
          platform: 'IOS',
          min_supported_version: '1.2.0',
          latest_version: '1.4.0',
          update_url: 'https://apps.apple.com/app/id1',
        },
      });
    });

    it('refuses invalid settings with 422 field errors', async () => {
      const current = await http().get('/api/admin/v1/settings').set(asSuperAdmin);
      const response = await http()
        .put('/api/admin/v1/settings')
        .set(asSuperAdmin)
        .send({ ...current.body.data, review_every_opportunity: false });
      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: { review_every_opportunity: ['every opportunity is reviewed (D9)'] },
      });
    });

    it('a Reviewer cannot change settings (403)', async () => {
      const response = await http().put('/api/admin/v1/settings').set({ 'x-test-actor': 'staff:REVIEWER' }).send({});
      expect(response.status).toBe(403);
    });
  });

  describe('Idempotency-Key', () => {
    const post = (key: string | null, body: object) => {
      const req = http().post('/api/app/v1/__probe/idempotent').send(body);
      return key ? req.set('Idempotency-Key', key) : req;
    };

    it('replays the first response for a repeat with the same key and body', async () => {
      const first = await post('order-1', { amount: 5 });
      const second = await post('order-1', { amount: 5 });
      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(second.body).toEqual(first.body);
      expect(second.headers['idempotent-replayed']).toBe('true');
    });

    it('refuses the same key with a different body (422) and a missing key (400)', async () => {
      await post('order-2', { amount: 5 });
      const reused = await post('order-2', { amount: 6 });
      expect(reused.status).toBe(422);
      expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');

      const missing = await post(null, { amount: 5 });
      expect(missing.status).toBe(400);
      expect(missing.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    });
  });

  describe('audit', () => {
    it('@AuditRead writes one audit row per sensitive read', async () => {
      const response = await http()
        .get(`/api/admin/v1/__probe/documents/${DOC_ID}`)
        .set({ 'x-test-actor': 'staff:REVIEWER' });
      expect(response.status).toBe(200);
      expect(await auditRows()).toEqual([
        { action: 'verification.document.view', actor_type: 'STAFF', actor_user_id: TEST_STAFF_ID, entity_id: DOC_ID },
      ]);
    });

    it('fails closed: if the audit row cannot be written, the read fails', async () => {
      const spy = jest.spyOn(app.get(AuditLogger), 'record').mockRejectedValueOnce(new Error('database unavailable'));
      const response = await http()
        .get(`/api/admin/v1/__probe/documents/${DOC_ID}`)
        .set({ 'x-test-actor': 'staff:REVIEWER' });
      spy.mockRestore();
      expect(response.status).toBe(500);
      expect(JSON.stringify(response.body)).not.toContain('storage.example');
    });

    it('an admin write without an audit row fails in test; with one it passes', async () => {
      const unaudited = await http().post('/api/admin/v1/__probe/unaudited').set(asSuperAdmin);
      expect(unaudited.status).toBe(500);
      const audited = await http().post('/api/admin/v1/__probe/audited').set(asSuperAdmin);
      expect(audited.status).toBe(201);
    });
  });

  describe('language', () => {
    it.each([
      [undefined, 'en'],
      ['ar-SA,en;q=0.8', 'ar'],
      ['fr', 'en'],
    ])('Accept-Language %s → %s', async (header, locale) => {
      const req = http().get('/api/app/v1/__probe/locale');
      const response = await (header ? req.set('Accept-Language', header) : req);
      expect(response.body).toEqual({ data: { locale } });
    });
  });
});
