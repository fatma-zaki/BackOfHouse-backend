import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { PrismaService } from '../../src/platform/database/prisma.service';
import { applyTestEnv } from '../support/database';

/**
 * Regression: the pg adapter sends Date parameters without a UTC offset. If the
 * session time zone is not UTC (a local Postgres in Asia/Riyadh), every Date
 * comparison is off by the zone's offset; expiry and SLA checks break silently.
 */
describe('database session time zone (real Postgres)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    applyTestEnv();
    moduleRef = await Test.createTestingModule({ imports: [ConfigModule, DatabaseModule] }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('runs every app session in UTC', async () => {
    const [{ tz }] = await prisma.$queryRaw<{ tz: string }[]>`SELECT current_setting('TimeZone') AS tz`;
    expect(tz).toBe('UTC');
  });

  it('compares Date parameters with now() correctly', async () => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
    const [row] = await prisma.$queryRaw<{ past: boolean; future: boolean }[]>`
      SELECT ${hourAgo}::timestamptz < now() AS past, ${inAnHour}::timestamptz > now() AS future`;
    expect(row).toEqual({ past: true, future: true });
  });
});
