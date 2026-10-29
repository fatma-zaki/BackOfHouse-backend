import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/http-app';
import { PrismaClient } from '../../src/generated/prisma/client';
import { ADMIN_ACTOR_RESOLVER } from '../../src/surfaces/actor-resolver';
import { seedLocations, seedSampleTaxonomy } from '../../prisma/seed/seeders/taxonomy.seeder';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { TestHeaderActorResolver } from '../support/test-actors';
import { testDatabaseUrl } from '../support/test-db-state';

/** contracts/admin GET/PUT /taxonomy/{kind} and contracts/app GET /meta/taxonomy. */
describe('Taxonomy (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let seedClient: PrismaClient;
  const http = () => request(app.getHttpServer());
  const asSuperAdmin = { 'x-test-actor': 'staff:SUPER_ADMIN' };

  beforeAll(async () => {
    applyTestEnv();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ADMIN_ACTOR_RESOLVER)
      .useClass(TestHeaderActorResolver)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureHttpApp(app, app.get(AppConfig));
    await app.init();
    admin = await connectAdmin();
    seedClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl() }) });
  });

  afterAll(async () => {
    await seedClient.$disconnect();
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    await seedLocations(seedClient);
    await seedSampleTaxonomy(seedClient);
  });

  it('staff list and replace a kind; the app sees the change in its language', async () => {
    const list = await http().get('/api/admin/v1/taxonomy/crafts').set(asSuperAdmin);
    expect(list.status).toBe(200);
    expect(list.body.data[0]).toEqual({
      id: expect.any(String),
      name: { en: 'Stage Manager', ar: 'مدير مسرح' },
      active: true,
      order: 0,
    });

    const replaced = await http()
      .put('/api/admin/v1/taxonomy/crafts')
      .set(asSuperAdmin)
      .send([
        { id: list.body.data[0].id, name: { en: 'Stage Manager', ar: 'مدير خشبة المسرح' } },
        { name: { en: 'Drone Pilot', ar: 'قائد درون' } },
      ]);
    expect(replaced.status).toBe(200);

    const catalog = await http().get('/api/app/v1/meta/taxonomy').set('Accept-Language', 'ar');
    expect(catalog.status).toBe(200);
    expect(catalog.body.data.crafts.map((c: { name: string }) => c.name)).toEqual(['مدير خشبة المسرح', 'قائد درون']);
    expect(catalog.body.data.cities.find((c: { name: string }) => c.name === 'الرياض').region.name).toBe(
      'منطقة الرياض',
    );
    expect(Object.keys(catalog.body.data).sort()).toEqual(
      ['cities', 'company_types', 'crafts', 'industries', 'news_topics', 'opportunity_types'].sort(),
    );
  });

  it('answers 404 for an unknown kind and 422 for an invalid list', async () => {
    expect((await http().get('/api/admin/v1/taxonomy/listing_types').set(asSuperAdmin)).status).toBe(404);
    const invalid = await http().put('/api/admin/v1/taxonomy/news_topics').set(asSuperAdmin).send([]);
    expect(invalid.status).toBe(422);
    expect(invalid.body.code).toBe('VALIDATION_FAILED');
  });

  it('is public on the app surface and permission-gated on the admin surface', async () => {
    expect((await http().get('/api/app/v1/meta/taxonomy')).status).toBe(200);
    expect((await http().get('/api/admin/v1/taxonomy/crafts')).status).toBe(401);
    expect((await http().get('/api/admin/v1/taxonomy/crafts').set({ 'x-test-actor': 'staff:EDITOR' })).status).toBe(
      403,
    );
  });
});
