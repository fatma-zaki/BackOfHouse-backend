import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { applyTestEnv } from '../support/database';

/** Phase 0 exit criteria (execution-plan.md): two surfaces, two Swagger pages, forced-update policy. */
describe('API surfaces (e2e, ADR-031)', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    applyTestEnv({ APP_IOS_MIN_SUPPORTED_VERSION: '1.1.0', APP_IOS_LATEST_VERSION: '1.4.2' });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['/api/app/v1/ping', 'app'],
    ['/api/admin/v1/ping', 'admin'],
  ])('GET %s answers from the %s surface', async (path, surface) => {
    const response = await http().get(path);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'OK', surface } });
  });

  it('no longer serves the old /api/v1 prefix', async () => {
    expect((await http().get('/api/v1/health')).status).toBe(404);
  });

  describe('Swagger: one page per surface', () => {
    it('documents only app routes on /docs/app', async () => {
      const response = await http().get('/docs/app-json');
      expect(response.status).toBe(200);
      const paths = Object.keys(response.body.paths);
      expect(paths).toEqual(expect.arrayContaining(['/api/app/v1/ping', '/api/app/v1/meta/app-version']));
      expect(paths.every((p) => p.startsWith('/api/app/v1/'))).toBe(true);
    });

    it('documents only admin routes on /docs/admin', async () => {
      const response = await http().get('/docs/admin-json');
      expect(response.status).toBe(200);
      const paths = Object.keys(response.body.paths);
      expect(paths).toContain('/api/admin/v1/ping');
      expect(paths.every((p) => p.startsWith('/api/admin/v1/'))).toBe(true);
    });
  });

  describe('GET /api/app/v1/meta/app-version (D11)', () => {
    it('returns the policy for the platform', async () => {
      const response = await http().get('/api/app/v1/meta/app-version?platform=IOS');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          platform: 'IOS',
          min_supported_version: '1.1.0',
          latest_version: '1.4.2',
          update_url: 'https://apps.apple.com/',
        },
      });
    });

    it('rejects an unknown platform with 422', async () => {
      const response = await http().get('/api/app/v1/meta/app-version?platform=WINDOWS');
      expect(response.status).toBe(422);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });
  });
});
