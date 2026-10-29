import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { PrismaService } from '../../src/platform/database/prisma.service';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { TaxonomyModule, TaxonomyService } from '../../src/modules/taxonomy';
import { PrismaClient } from '../../src/generated/prisma/client';
import { SAUDI_REGIONS, seedLocations, seedSampleTaxonomy } from '../../prisma/seed/seeders/taxonomy.seeder';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { memberActor, staffActor } from '../support/test-actors';
import { testDatabaseUrl } from '../support/test-db-state';

describe('TaxonomyService (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let taxonomy: TaxonomyService;
  let prisma: PrismaService;
  let seedClient: PrismaClient;
  const superAdmin = staffActor('SUPER_ADMIN');

  beforeAll(async () => {
    applyTestEnv();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, AuditModule, TaxonomyModule],
    }).compile();
    await moduleRef.init();
    taxonomy = moduleRef.get(TaxonomyService);
    prisma = moduleRef.get(PrismaService);
    seedClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl() }) });
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await seedClient.$disconnect();
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  it('seeds the 13 regions and their cities once', async () => {
    const cityCount = SAUDI_REGIONS.reduce((n, r) => n + r.cities.length, 0);
    await expect(seedLocations(seedClient)).resolves.toBe(13 + cityCount);
    await expect(seedLocations(seedClient)).resolves.toBe(0);
    const riyadh = await prisma.location.findUnique({ where: { slug: 'riyadh' }, include: { parent: true } });
    expect(riyadh).toMatchObject({ type: 'CITY', nameAr: 'الرياض', parent: { slug: 'riyadh-region' } });
  });

  describe('table kinds (cities, crafts, industries)', () => {
    it('updates sent items, adds items without an id, deactivates the ones left out, and audits', async () => {
      await seedSampleTaxonomy(seedClient);
      const before = await taxonomy.list(superAdmin, 'crafts');
      const [first, second] = before;

      const after = await taxonomy.replace(superAdmin, 'crafts', [
        { id: second.id, name: { en: 'Senior Event Coordinator', ar: 'منسّق فعاليات أول' }, order: 0 },
        { id: first.id, name: first.name, order: 1 },
        { name: { en: 'Stage Manager', ar: 'مدير مسرح ٢' }, order: 2 },
      ]);

      expect(after.filter((i) => i.active).map((i) => [i.name.en, i.active, i.order])).toEqual([
        ['Senior Event Coordinator', true, 0],
        [first.name.en, true, 1],
        ['Stage Manager', true, 2],
      ]);
      expect(after.filter((i) => !i.active)).toHaveLength(before.length - 2);
      const created = await prisma.skill.findMany({
        where: { slug: { startsWith: 'stage-manager' } },
        orderBy: { slug: 'asc' },
      });
      expect(created.map((s) => s.slug)).toEqual(['stage-manager', 'stage-manager-2']);
      const audit = await admin.query(`SELECT action, entity_type FROM app.audit_logs`);
      expect(audit.rows).toEqual([{ action: 'taxonomy.update', entity_type: 'taxonomy.crafts' }]);
    });

    it('refuses unknown ids, duplicate ids and blank names with 422 and writes nothing', async () => {
      await seedSampleTaxonomy(seedClient);
      const [first] = await taxonomy.list(superAdmin, 'crafts');
      const bad = [
        [{ id: '0191f0a0-0000-7000-8000-000000000999', name: { en: 'X', ar: 'س' } }],
        [
          { id: first.id, name: first.name },
          { id: first.id, name: first.name },
        ],
        [{ name: { en: 'Only English', ar: '  ' } }],
      ];
      for (const items of bad) {
        await expect(taxonomy.replace(superAdmin, 'crafts', items)).rejects.toMatchObject({
          code: 'VALIDATION_FAILED',
        });
      }
      expect((await admin.query(`SELECT count(*)::int AS n FROM app.audit_logs`)).rows[0].n).toBe(0);
    });

    it('edits cities without touching regions', async () => {
      await seedLocations(seedClient);
      const cities = await taxonomy.list(superAdmin, 'cities');
      await taxonomy.replace(superAdmin, 'cities', cities.slice(0, 2));
      expect(await prisma.location.count({ where: { type: 'REGION', isActive: true } })).toBe(13);
      expect(await prisma.location.count({ where: { type: 'CITY', isActive: true } })).toBe(2);
    });
  });

  describe('fixed kinds (company_types, opportunity_types, news_topics)', () => {
    it('serves code defaults and accepts new labels and order for exactly the codes', async () => {
      const defaults = await taxonomy.list(superAdmin, 'news_topics');
      expect(defaults.map((i) => i.id)).toEqual(['TECHNICAL', 'REGULATORY', 'MARKET']);

      const reordered = await taxonomy.replace(superAdmin, 'news_topics', [
        { id: 'MARKET', name: { en: 'Market & business', ar: 'السوق والأعمال' } },
        { id: 'TECHNICAL', name: defaults[0].name },
        { id: 'REGULATORY', name: defaults[1].name },
      ]);
      expect(reordered.map((i) => [i.id, i.name.en])).toEqual([
        ['MARKET', 'Market & business'],
        ['TECHNICAL', 'Technical'],
        ['REGULATORY', 'Regulatory'],
      ]);
    });

    it.each([
      ['a missing code', [{ id: 'TECHNICAL', name: { en: 'T', ar: 'ت' } }]],
      [
        'an added code',
        ['TECHNICAL', 'REGULATORY', 'MARKET', 'SPORTS'].map((id) => ({ id, name: { en: id, ar: 'ع' } })),
      ],
      [
        'a deactivated code',
        ['TECHNICAL', 'REGULATORY', 'MARKET'].map((id) => ({ id, name: { en: id, ar: 'ع' }, active: id !== 'MARKET' })),
      ],
    ])('refuses %s with 422', async (_label, items) => {
      await expect(taxonomy.replace(superAdmin, 'news_topics', items)).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
      });
    });
  });

  it('answers 404 for an unknown kind', async () => {
    await expect(taxonomy.list(superAdmin, 'listing_types')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it.each([
    ['a member', memberActor()],
    ['a Reviewer (no settings.view)', staffActor('REVIEWER')],
    ['no actor', undefined],
  ])('refuses %s, whoever calls the service', async (_label, actor) => {
    await expect(taxonomy.list(actor, 'crafts')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(taxonomy.replace(actor, 'crafts', [])).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('publishes active items only, in the requested language, cities with their region', async () => {
    await seedLocations(seedClient);
    await seedSampleTaxonomy(seedClient);
    await prisma.skill.updateMany({ where: { slug: 'rigger' }, data: { isActive: false } });

    const ar = await taxonomy.publicCatalog('ar');
    expect(ar.cities.find((c) => c.name === 'جدة')).toMatchObject({ region: { name: 'منطقة مكة المكرمة' } });
    expect(ar.crafts.map((c) => c.name)).not.toContain('فنّي تعليق ورفع');
    expect(ar.company_types[0]).toEqual({ id: 'EVENT_ORGANIZER', name: 'منظّم فعاليات' });

    const en = await taxonomy.publicCatalog('en');
    expect(en.opportunity_types.map((t) => t.id)).toEqual([
      'JOB',
      'PROJECT',
      'CO_OP',
      'VOLUNTEERING',
      'SUPPLIER_REQUEST',
    ]);
  });
});
