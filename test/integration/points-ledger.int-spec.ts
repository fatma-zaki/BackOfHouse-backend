import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { PointsService } from '../../src/modules/engagement';
import { bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { connectAdmin, resetDatabase } from '../support/database';

/**
 * Exit tests (execution-plan Phase 6, BQ-76): the ledger is append-only like audit_logs
 * (revoked UPDATE/DELETE/TRUNCATE and the `raise_immutable()` trigger); an award keyed
 * `event_attendance:<user>:<event>` happens once; concurrent credits keep the balance equal
 * to the ledger sum; spending never lowers the level.
 */
describe('Points ledger (integration)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let points: PointsService;
  let member: RegisteredAccount;

  const attendance = (event: string, amount = 150) =>
    points.credit({
      userId: member.userId,
      amount,
      type: 'EVENT_ATTENDANCE',
      title: 'Riyadh Season opening',
      source: { type: 'event', id: event },
      idempotencyKey: `event_attendance:${member.userId}:${event}`,
    });

  const ledgerSum = async () =>
    (
      await admin.query<{ sum: number }>(
        `SELECT COALESCE(SUM(amount), 0)::int AS sum FROM app.point_ledger WHERE user_id = $1`,
        [member.userId],
      )
    ).rows[0].sum;

  beforeAll(async () => {
    ({ app } = await bootApp());
    points = app.get(PointsService, { strict: false });
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    member = await registerAccount(app, { name: 'Huda Rigger' });
  });

  it('refuses UPDATE, DELETE and TRUNCATE on the ledger, and the runtime role holds none of them', async () => {
    await attendance('e1');
    await expect(admin.query(`UPDATE app.point_ledger SET amount = 9999`)).rejects.toThrow(/append-only/);
    await expect(admin.query(`DELETE FROM app.point_ledger`)).rejects.toThrow(/append-only/);
    await expect(admin.query(`TRUNCATE app.point_ledger`)).rejects.toThrow(/append-only/);
    const privileges = await admin.query<{ privilege: string; held: boolean }>(
      `SELECT p AS privilege, has_table_privilege('boh_app', 'app.point_ledger', p) AS held
         FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) AS p`,
    );
    expect(privileges.rows).toEqual([
      { privilege: 'SELECT', held: true },
      { privilege: 'INSERT', held: true },
      { privilege: 'UPDATE', held: false },
      { privilege: 'DELETE', held: false },
      { privilege: 'TRUNCATE', held: false },
    ]);
  });

  it('awards attendance once per member and event, even when sent at the same time', async () => {
    const results = await Promise.all([attendance('e1'), attendance('e1'), attendance('e1')]);
    expect(results.filter((r) => r !== null)).toHaveLength(1);
    expect(await attendance('e1')).toBeNull();
    expect(await ledgerSum()).toBe(150);
    expect((await points.summaryOf(member.userId)).balance).toBe(150);
  });

  it('keeps the balance equal to the ledger sum under concurrent credits', async () => {
    await Promise.all(Array.from({ length: 10 }, (_, i) => attendance(`e${i}`, 10 + i)));
    const summary = await points.summaryOf(member.userId);
    expect(summary.balance).toBe(await ledgerSum());
    expect(summary.balance).toBe(145);
  });

  it('never lowers the level when points are spent', async () => {
    await attendance('e1', 600);
    expect((await points.summaryOf(member.userId)).level).toBe(3);
    await points.credit({
      userId: member.userId,
      amount: -500,
      type: 'REWARD_REDEMPTION',
      title: 'Profile Highlight',
      idempotencyKey: `redemption:test-${member.userId}`,
    });
    expect(await points.summaryOf(member.userId)).toMatchObject({
      balance: 100,
      totalEarned: 600,
      totalSpent: 500,
      level: 3,
    });
    await expect(
      points.credit({
        userId: member.userId,
        amount: -101,
        type: 'REWARD_REDEMPTION',
        title: 'Course',
        idempotencyKey: `redemption:test2-${member.userId}`,
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_POINTS' });
  });
});
