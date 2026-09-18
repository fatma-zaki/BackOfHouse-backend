import { AppConfig } from '../../src/config/app.config';
import { parseEnv } from '../../src/config/env.schema';
import { JobsService } from '../../src/platform/jobs/jobs.service';
import { connectAdmin, testEnv } from '../support/database';

/** pg-boss against the real test database (ADR-010). */
describe('JobsService (real Postgres)', () => {
  it('starts, registers an idempotent cron schedule and stops', async () => {
    const jobs = new JobsService(new AppConfig(parseEnv(testEnv())));

    await jobs.start();
    await jobs.registerCron('test.nightly', '0 3 * * *', async () => undefined);
    // Registering again on the next boot must not duplicate the schedule.
    await jobs.registerCron('test.nightly', '0 3 * * *', async () => undefined);
    await jobs.stop();

    const admin = await connectAdmin();
    const { rows } = await admin.query(`SELECT name, cron, timezone FROM pgboss.schedule WHERE name = 'test.nightly'`);
    await admin.end();

    expect(rows).toEqual([{ name: 'test.nightly', cron: '0 3 * * *', timezone: 'Asia/Riyadh' }]);
  });

  it('refuses the Supavisor transaction pooler', async () => {
    const jobs = new JobsService(
      new AppConfig(
        parseEnv(testEnv({ DATABASE_URL: 'postgresql://u:p@pooler.supabase.com:6543/postgres?pgbouncer=true' })),
      ),
    );

    await expect(jobs.start()).rejects.toThrow(/session-mode or direct DATABASE_URL/);
  });
});
