import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { Public } from '../../src/common/decorators/public.decorator';
import { ParseUuidPipe } from '../../src/common/pipes/parse-uuid.pipe';
import { CursorPaginationQueryDto, Page } from '../../src/common/pagination';
import { applyTestEnv } from '../support/database';

class CreateProbeDto {
  @IsString()
  @MaxLength(20)
  trade_name_en!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;
}

/** Exercises the global pipeline; not part of the application. */
@Controller('probe')
class ProbeController {
  @Get('protected')
  protectedRoute(): { ok: boolean } {
    return { ok: true };
  }

  @Public()
  @Post()
  create(@Body() dto: CreateProbeDto): CreateProbeDto {
    return dto;
  }

  @Public()
  @Get('items')
  list(@Query() _query: CursorPaginationQueryDto): Page<{ n: number }> {
    return new Page([{ n: 1 }], { next_cursor: null, has_more: false });
  }

  @Public()
  @Get('items/:id')
  one(@Param('id', ParseUuidPipe) id: string): { id: string } {
    return { id };
  }

  @Public()
  @Get('boom')
  boom(): never {
    throw new Error('connection string postgres://user:hunter2@db leaked');
  }
}

describe('HTTP foundation (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    applyTestEnv();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('health', () => {
    it('answers liveness without authentication', async () => {
      const response = await http().get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: { status: 'ok' } });
    });

    it('reports ready when the database is reachable', async () => {
      const response = await http().get('/api/v1/health/ready');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: { status: 'ok' } });
    });
  });

  describe('deny by default', () => {
    it('refuses a route that is not marked @Public', async () => {
      const response = await http().get('/api/v1/probe/protected');
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
    });

    it('refuses it even with a bearer token, until the identity module verifies tokens', async () => {
      const response = await http().get('/api/v1/probe/protected').set('Authorization', 'Bearer anything');
      expect(response.status).toBe(401);
    });
  });

  describe('error format and tracing', () => {
    it('returns { code, message, trace_id, errors } with 422 for validation failures', async () => {
      const response = await http()
        .post('/api/v1/probe')
        .send({ trade_name_en: 'x'.repeat(30), rating: 99 });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED', message: 'Validation failed' });
      expect(Object.keys(response.body.errors).sort()).toEqual(['rating', 'trade_name_en']);
      expect(typeof response.body.trace_id).toBe('string');
    });

    it('rejects unknown properties (mass-assignment protection)', async () => {
      const response = await http().post('/api/v1/probe').send({ trade_name_en: 'ok', rating: 3, is_admin: true });
      expect(response.status).toBe(422);
      expect(response.body.errors).toHaveProperty('is_admin');
    });

    it('echoes a client X-Request-Id as trace_id and response header', async () => {
      const response = await http().get('/api/v1/probe/protected').set('X-Request-Id', 'client-trace-0001');
      expect(response.headers['x-request-id']).toBe('client-trace-0001');
      expect(response.body.trace_id).toBe('client-trace-0001');
    });

    it('replaces an unsafe client request id', async () => {
      const response = await http().get('/api/v1/health').set('X-Request-Id', '<script>');
      expect(response.headers['x-request-id']).not.toBe('<script>');
    });

    it('rejects a malformed UUID path parameter with 422', async () => {
      const response = await http().get('/api/v1/probe/items/not-a-uuid');
      expect(response.status).toBe(422);
      expect(response.body.errors).toEqual({ id: ['must be a UUID'] });
    });

    it('uses the error format for unknown routes', async () => {
      const response = await http().get('/api/v1/does-not-exist');
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('hides the details of unexpected errors', async () => {
      const response = await http().get('/api/v1/probe/boom');
      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(response.body)).not.toContain('hunter2');
    });

    it('answers malformed JSON with 400', async () => {
      const response = await http()
        .post('/api/v1/probe')
        .set('Content-Type', 'application/json')
        .send('{"trade_name_en": ');
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('BAD_REQUEST');
    });

    it('answers an oversized body with 413', async () => {
      const response = await http()
        .post('/api/v1/probe')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ trade_name_en: 'x'.repeat(300_000), rating: 1 }));
      expect(response.status).toBe(413);
      expect(response.body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('success envelope and pagination', () => {
    it('wraps a Page as { data, meta }', async () => {
      const response = await http().get('/api/v1/probe/items');
      expect(response.body).toEqual({ data: [{ n: 1 }], meta: { next_cursor: null, has_more: false } });
    });

    it('rejects a limit above 100', async () => {
      const response = await http().get('/api/v1/probe/items?limit=500');
      expect(response.status).toBe(422);
      expect(response.body.errors).toHaveProperty('limit');
    });
  });

  describe('security headers and CORS', () => {
    it('sets security headers and hides the framework', async () => {
      const response = await http().get('/api/v1/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('allows a configured origin', async () => {
      const response = await http().get('/api/v1/health').set('Origin', 'https://app.backofhouse.test');
      expect(response.headers['access-control-allow-origin']).toBe('https://app.backofhouse.test');
    });

    it('does not allow an unknown origin', async () => {
      const response = await http().get('/api/v1/health').set('Origin', 'https://evil.example');
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
