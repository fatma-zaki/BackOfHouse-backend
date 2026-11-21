import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { PointsService } from '../../../src/modules/engagement';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';

/** Phase 6A: points (contracts/app /me/points*, contracts/admin /points/*, /earning-rules*). */
describe('Points (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let points: PointsService;
  let member: RegisteredAccount;

  const staff = (method: 'get' | 'post' | 'put', path: string, role = 'SUPER_ADMIN') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const adjust = (body: object, role = 'SUPER_ADMIN') =>
    staff('post', '/points/adjustments', role).send({
      user_id: member.userId,
      reason: 'GOODWILL',
      note: 'Thanks for helping at the expo',
      ...body,
    });

  const drain = async () => {
    while ((await dispatcher.dispatchOnce()).claimed > 0);
  };

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
    dispatcher = app.get(OutboxDispatcher);
    points = app.get(PointsService, { strict: false });
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    await admin.query(
      `INSERT INTO app.staff_accounts (id, email, name, role, status, activated_at, updated_at)
       VALUES ($1, 'admin@backofhouse.test', 'Sami Admin', 'SUPER_ADMIN', 'ACTIVE', now(), now())`,
      [TEST_STAFF_ID],
    );
    member = await registerAccount(app, { name: 'Huda Rigger' });
  });

  it('starts at level 1 with nothing, and shows adjustments in the history and the ledger', async () => {
    const empty = await appRequest(app, 'get', '/me/points', member);
    expect(empty.status).toBe(200);
    expect(contractErrors('app', 'get', '/me/points', 200, empty.body)).toEqual([]);
    expect(empty.body.data).toEqual({
      balance: 0,
      earned_this_month: 0,
      level: 1,
      level_target: 100,
      next_benefit_at: 100,
      total_earned: 0,
      total_spent: 0,
    });

    const added = await adjust({ amount: 120 });
    expect(added.status).toBe(201);
    expect(contractErrors('admin', 'post', '/points/adjustments', 201, added.body)).toEqual([]);
    expect(added.body.data).toMatchObject({
      amount: 120,
      type: 'MANUAL_ADJUSTMENT',
      title: 'Thank-you points from Back of House',
      reason: 'GOODWILL',
      created_by: { id: TEST_STAFF_ID, name: 'Sami Admin' },
    });
    clock.advance(60_000);
    expect((await adjust({ amount: -20, reason: 'CORRECTION', note: 'Double counted' })).status).toBe(201);

    const summary = (await appRequest(app, 'get', '/me/points', member)).body.data;
    expect(summary).toMatchObject({
      balance: 100,
      earned_this_month: 120,
      level: 2,
      level_target: 500,
      total_earned: 100,
    });

    const history = await appRequest(app, 'get', '/me/points/transactions', member);
    expect(contractErrors('app', 'get', '/me/points/transactions', 200, history.body)).toEqual([]);
    expect(history.body.data.map((t: { activity: string; points: number }) => [t.activity, t.points])).toEqual([
      ['ADJUSTMENT', -20],
      ['ADJUSTMENT', 120],
    ]);
    expect(
      (await appRequest(app, 'get', '/me/points/transactions?filter=EARNED', member)).body.data.map(
        (t: { points: number }) => t.points,
      ),
    ).toEqual([120]);
    expect((await appRequest(app, 'get', '/me/points/transactions?filter=REDEEMED', member)).body.data).toEqual([]);

    const ledger = await staff('get', `/points/ledger?user_id=${member.userId}`);
    expect(ledger.status).toBe(200);
    expect(contractErrors('admin', 'get', '/points/ledger', 200, ledger.body)).toEqual([]);
    expect(ledger.body.meta.total).toBe(2);
    const ofUser = await staff('get', `/users/${member.userId}/points?limit=1`, 'SUPPORT');
    expect(contractErrors('admin', 'get', '/users/{id}/points', 200, ofUser.body)).toEqual([]);
    expect(ofUser.body.meta.has_more).toBe(true);

    const audit = await admin.query(`SELECT action FROM app.audit_logs WHERE action = 'points.adjust'`);
    expect(audit.rowCount).toBe(2);
    await drain();
    const sent = await appRequest(app, 'get', '/me/notifications', member);
    expect(sent.body.data).toMatchObject([{ title: 'You earned 120 points', points_delta: 120 }]);
  });

  it('caps Support at 500 added points per member per month, and refuses deductions from Support', async () => {
    await admin.query(`UPDATE app.staff_accounts SET role = 'SUPPORT' WHERE id = $1`, [TEST_STAFF_ID]);
    expect((await adjust({ amount: 400 }, 'SUPPORT')).status).toBe(201);
    const over = await adjust({ amount: 101 }, 'SUPPORT');
    expect({ status: over.status, code: over.body.code }).toEqual({ status: 422, code: 'MONTHLY_CAP_REACHED' });
    expect((await adjust({ amount: 100 }, 'SUPPORT')).status).toBe(201);
    const minus = await adjust({ amount: -5 }, 'SUPPORT');
    expect(minus.body.errors).toEqual({ amount: ['must be positive; Support can only add points'] });
    // Super admins have no cap, but never take the balance below zero.
    await admin.query(`UPDATE app.staff_accounts SET role = 'SUPER_ADMIN' WHERE id = $1`, [TEST_STAFF_ID]);
    expect((await adjust({ amount: 1000 })).status).toBe(201);
    expect((await adjust({ amount: -5000 })).body.errors).toEqual({ amount: ['would take the balance below zero'] });
    expect((await adjust({ amount: 10, note: 'no' })).body.errors).toEqual({ note: ['must be at least 5 characters'] });
    expect((await adjust({ amount: 10 }, 'EDITOR')).status).toBe(403);
  });

  it('replays an adjustment sent twice with the same Idempotency-Key', async () => {
    const send = () =>
      staff('post', '/points/adjustments')
        .set('Idempotency-Key', '0191f0a0-0000-7000-8000-0000000000aa')
        .send({ user_id: member.userId, amount: 50, reason: 'GOODWILL', note: 'Expo volunteer' });
    const first = await send();
    const second = await send();
    expect(second.body.data.id).toBe(first.body.data.id);
    expect((await appRequest(app, 'get', '/me/points', member)).body.data.balance).toBe(50);
  });

  it('lists the earning rules and keeps registration locked at 0', async () => {
    const rules = await staff('get', '/earning-rules', 'SUPPORT');
    expect(contractErrors('admin', 'get', '/earning-rules', 200, rules.body)).toEqual([]);
    expect(
      rules.body.data.map((r: { key: string; points: number; locked: boolean }) => [r.key, r.points, r.locked]),
    ).toEqual([
      ['EVENT_REGISTRATION', 0, true],
      ['EVENT_ATTENDANCE', 150, false],
      ['VOLUNTEER_SHIFT', 200, false],
      ['PROFILE_COMPLETED', 50, false],
      ['REFERRAL_ATTENDED', 50, false],
    ]);
    const locked = await staff('put', '/earning-rules/EVENT_REGISTRATION').send({ points: 10 });
    expect({ status: locked.status, code: locked.body.code }).toEqual({ status: 422, code: 'RULE_LOCKED' });
    const changed = await staff('put', '/earning-rules/event_attendance').send({ points: 175 });
    expect(changed.status).toBe(200);
    expect(contractErrors('admin', 'put', '/earning-rules/{key}', 200, changed.body)).toEqual([]);
    expect(changed.body.data).toMatchObject({ key: 'EVENT_ATTENDANCE', points: 175 });
    expect((await staff('put', '/earning-rules/EVENT_ATTENDANCE', 'SUPPORT').send({ points: 1 })).status).toBe(403);
    expect((await staff('put', '/earning-rules/NOPE').send({ points: 1 })).status).toBe(404);
  });

  it('awards "profile completed" once, when the profile has every part (decided 2026-11-21)', async () => {
    const skill = (
      await admin.query(
        `INSERT INTO app.skills (id, slug, name_en, name_ar, is_active, updated_at)
         VALUES (gen_random_uuid(), 'rigging', 'Rigging', 'تعليق المعدات', true, now()) RETURNING id`,
      )
    ).rows[0].id as string;
    await appRequest(app, 'patch', '/me/profile', member).send({
      name: 'Huda Rigger',
      headline: 'Head rigger',
      city: 'Riyadh',
      about: 'Ten years on festival rigs',
      profile_status: 'PROFESSIONAL',
      interests: [],
      contact_privacy: { share_email: false, share_phone: false },
    });
    await appRequest(app, 'post', '/me/experience', member).send({
      role: 'Rigger',
      company: 'Stage Co',
      start: '2020-01-01',
    });
    await appRequest(app, 'put', '/me/skills', member).send({ skill_ids: [skill] });
    await drain();
    expect((await appRequest(app, 'get', '/me/points', member)).body.data.balance).toBe(0);

    await appRequest(app, 'post', '/me/projects', member).send({
      year: 2024,
      category: 'Concert',
      title: 'Winter tour',
      role: 'Head rigger',
    });
    await drain();
    await appRequest(app, 'post', '/me/projects', member).send({
      year: 2023,
      category: 'Expo',
      title: 'Expo',
      role: 'Rigger',
    });
    await drain();
    const history = (await appRequest(app, 'get', '/me/points/transactions', member)).body.data;
    expect(history.map((t: { activity: string; points: number }) => [t.activity, t.points])).toEqual([
      ['PROFILE_COMPLETION', 50],
    ]);
  });

  it('rebuilds a balance that drifted from the ledger (points.reconcile)', async () => {
    await adjust({ amount: 300 });
    await admin.query(`UPDATE app.point_balances SET balance = 999, total_earned = 999 WHERE user_id = $1`, [
      member.userId,
    ]);
    expect(await points.reconcile()).toBe(1);
    expect(await points.reconcile()).toBe(0);
    expect((await appRequest(app, 'get', '/me/points', member)).body.data).toMatchObject({
      balance: 300,
      total_earned: 300,
      level: 2,
    });
  });
});
