import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import request from 'supertest';
import { EventsService } from '../../../src/modules/events';
import { OutboxDispatcher } from '../../../src/platform/outbox';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';
import { FakeClock } from '../../support/fake-staff-idp';
import { TEST_STAFF_ID } from '../../support/test-actors';

const ADMIN = '/api/admin/v1';
const HOUR = 3_600_000;

/** Phase 6B: events, registration, check-in and attendance points (contracts/app and admin /events*). */
describe('Events (e2e)', () => {
  let app: NestExpressApplication;
  let clock: FakeClock;
  let admin: Client;
  let dispatcher: OutboxDispatcher;
  let events: EventsService;
  let huda: RegisteredAccount;
  let omar: RegisteredAccount;

  const staff = (method: 'get' | 'post' | 'patch', path: string, role = 'SUPER_ADMIN') =>
    request(app.getHttpServer())[method](`${ADMIN}${path}`).set('x-test-actor', `staff:${role}`);

  const at = (hoursFromNow: number) => new Date(clock.now().getTime() + hoursFromNow * HOUR).toISOString();

  const EVENT = () => ({
    title: { en: 'Riyadh Stage Tech Summit', ar: 'قمة تقنيات المسرح' },
    description: { en: 'Two days of rigging and lighting talks.', ar: 'يومان من الجلسات.' },
    type: 'CONFERENCE',
    topics: ['Rigging', 'Lighting'],
    starts_at: at(48),
    ends_at: at(56),
    venue: 'Boulevard Hall',
    city: 'Riyadh',
    capacity: 2,
    featured: true,
    agenda: [
      { day: at(48).slice(0, 10), time: '18:00', title: { en: 'Opening keynote', ar: 'الافتتاح' }, location: 'Hall A' },
    ],
    speakers: [{ name: 'Lina Haddad', title: 'Technical director' }],
    status: 'PUBLISHED',
  });

  const drain = async () => {
    while ((await dispatcher.dispatchOnce()).claimed > 0);
  };

  beforeAll(async () => {
    ({ app, clock } = await bootApp({ testStaff: true }));
    dispatcher = app.get(OutboxDispatcher);
    events = app.get(EventsService, { strict: false });
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
    huda = await registerAccount(app, { name: 'Huda Rigger' });
    omar = await registerAccount(app, { name: 'Omar Lights', locale: 'ar' });
  });

  it('journey: publish → register (no points) → check in at the door → award attendance points once', async () => {
    const created = await staff('post', '/events').send(EVENT());
    expect(created.status).toBe(201);
    expect(contractErrors('admin', 'post', '/events', 201, created.body)).toEqual([]);
    const id = created.body.data.id as string;
    expect(created.body.data).toMatchObject({
      status: 'PUBLISHED',
      type: 'CONFERENCE',
      points_for_attendance: 150,
      points_status: 'UPCOMING',
      registered: 0,
    });

    const list = await appRequest(app, 'get', '/events', huda);
    expect(list.status).toBe(200);
    expect(contractErrors('app', 'get', '/events', 200, list.body)).toEqual([]);
    expect(list.body.data).toMatchObject([
      {
        id,
        title: 'Riyadh Stage Tech Summit',
        organizer: 'Back of House',
        flagship: true,
        points_reward: 150,
        is_registered: false,
        pass_code: null,
        agenda: [{ day: 1, title: 'Opening keynote', description: 'Hall A' }],
        speakers: [{ name: 'Lina Haddad', role: 'Technical director' }],
      },
    ]);

    const registered = await appRequest(app, 'put', `/events/${id}/registration`, huda);
    expect(registered.status).toBe(200);
    expect(contractErrors('app', 'put', '/events/{id}/registration', 200, registered.body)).toEqual([]);
    expect(registered.body.data).toMatchObject({ is_registered: true, attendees: 1 });
    const pass = registered.body.data.pass_code as string;
    expect(pass).toMatch(/^BOH-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const again = await appRequest(app, 'put', `/events/${id}/registration`, huda);
    expect(again.body.data).toMatchObject({ pass_code: pass, attendees: 1 });
    expect((await appRequest(app, 'get', '/me/points', huda)).body.data.balance).toBe(0);

    const arabic = await appRequest(app, 'put', `/events/${id}/registration`, omar, 'ar');
    expect(arabic.body.data).toMatchObject({ title: 'قمة تقنيات المسرح', attendees: 2 });

    clock.advance(49 * HOUR);
    const scans = await staff('post', `/events/${id}/check-ins`, 'EDITOR').send({
      scans: [
        { pass_code: pass, scanned_at: clock.now().toISOString(), gate: 'North' },
        { pass_code: pass, scanned_at: new Date(clock.now().getTime() + 60_000).toISOString() },
        { pass_code: 'BOH-FAKE-CODE', scanned_at: clock.now().toISOString() },
      ],
    });
    expect(scans.status).toBe(200);
    expect(contractErrors('admin', 'post', '/events/{id}/check-ins', 200, scans.body)).toEqual([]);
    expect(scans.body.data).toEqual({ matched: 1, unmatched: 1, duplicates: 1 });

    const attendance = await staff('get', `/events/${id}/attendance`);
    expect(contractErrors('admin', 'get', '/events/{id}/attendance', 200, attendance.body)).toEqual([]);
    expect(attendance.body.data).toEqual({
      registered: 2,
      verified: 1,
      unmatched_scans: 1,
      awarded: 0,
      pending_award: 1,
      points_per_attendee: 150,
    });
    expect((await staff('get', `/events/${id}`)).body.data.points_status).toBe('PARTLY_AWARDED');

    const award = await staff('post', `/events/${id}/award-points`, 'EDITOR');
    expect(award.status).toBe(202);
    expect(contractErrors('admin', 'post', '/events/{id}/award-points', 202, award.body)).toEqual([]);
    expect(award.body.data).toEqual({ awarded: 1, points_each: 150, skipped_already_awarded: 0 });
    expect((await staff('post', `/events/${id}/award-points`)).body.data).toEqual({
      awarded: 0,
      points_each: 150,
      skipped_already_awarded: 1,
    });
    expect((await staff('get', `/events/${id}`)).body.data.points_status).toBe('AWARDED');

    // (Member tokens expired with the clock; read the ledger directly.)
    const ledger = await admin.query(`SELECT user_id, type, title, amount, idempotency_key FROM app.point_ledger`);
    expect(ledger.rows).toEqual([
      {
        user_id: huda.userId,
        type: 'EVENT_ATTENDANCE',
        title: 'Riyadh Stage Tech Summit',
        amount: 150,
        idempotency_key: `event_attendance:${huda.userId}:${id}`,
      },
    ]);

    // After the end: COMPLETED, and the pass never scanned becomes NO_SHOW.
    clock.advance(8 * HOUR);
    expect(await events.complete()).toBe(1);
    const ofOmar = await staff('get', `/users/${omar.userId}/events`, 'SUPPORT');
    expect(ofOmar.status).toBe(200);
    expect(contractErrors('admin', 'get', '/users/{id}/events', 200, ofOmar.body)).toEqual([]);
    expect(ofOmar.body.data).toMatchObject([
      { event: { id, status: 'COMPLETED' }, registration: { status: 'NO_SHOW' } },
    ]);
    await drain();
    const earned = await admin.query(`SELECT type FROM app.notifications WHERE recipient_user_id = $1`, [huda.userId]);
    expect(earned.rows.map((r) => r.type)).toContain('points.earned');
  });

  it('caps registrations at capacity, frees a seat on cancel, and keeps drafts and other surfaces out', async () => {
    const id = (await staff('post', '/events').send(EVENT())).body.data.id as string;
    await appRequest(app, 'put', `/events/${id}/registration`, huda);
    await appRequest(app, 'put', `/events/${id}/registration`, omar);
    const third = await registerAccount(app, { name: 'Sara Sound' });
    const full = await appRequest(app, 'put', `/events/${id}/registration`, third);
    expect({ status: full.status, code: full.body.code }).toEqual({ status: 409, code: 'EVENT_FULL' });

    const cancelled = await appRequest(app, 'delete', `/events/${id}/registration`, omar);
    expect(contractErrors('app', 'delete', '/events/{id}/registration', 200, cancelled.body)).toEqual([]);
    expect(cancelled.body.data).toMatchObject({ is_registered: false, pass_code: null, attendees: 1 });
    expect((await appRequest(app, 'put', `/events/${id}/registration`, third)).status).toBe(200);

    const draft = (await staff('post', '/events').send({ ...EVENT(), status: undefined })).body.data.id as string;
    expect((await appRequest(app, 'get', `/events/${draft}`, huda)).status).toBe(404);
    expect((await appRequest(app, 'put', `/events/${draft}/registration`, huda)).status).toBe(404);
    const company = await registerAccount(app, {
      name: 'Venue Owner',
      company: { name: 'Stages', company_type: 'VENUE' },
    });
    expect((await appRequest(app, 'get', '/events', company)).status).toBe(403);
  });

  it('lets staff edit, cancel (telling registrants) and list events, with types the app now knows', async () => {
    const concert = await staff('post', '/events').send({ ...EVENT(), type: 'CONCERT', status: undefined });
    expect(concert.body.data).toMatchObject({ type: 'CONCERT', status: 'DRAFT' });
    const expo = await staff('post', '/events').send({ ...EVENT(), type: 'EXHIBITION' });
    expect(expo.body.data.type).toBe('EXHIBITION');
    expect((await appRequest(app, 'get', `/events/${expo.body.data.id}`, huda)).body.data.type).toBe('EXPO');

    const bad = await staff('post', '/events').send({ ...EVENT(), ends_at: at(1), starts_at: at(2) });
    expect(bad.body.errors).toEqual({ ends_at: ['must be after starts_at'] });
    expect((await staff('post', '/events', 'SUPPORT').send(EVENT())).status).toBe(403);

    const id = expo.body.data.id as string;
    await appRequest(app, 'put', `/events/${id}/registration`, huda);
    const edited = await staff('patch', `/events/${id}`).send({ venue: 'Hall B', points_for_attendance: 200 });
    expect(contractErrors('admin', 'patch', '/events/{id}', 200, edited.body)).toEqual([]);
    expect(edited.body.data).toMatchObject({ venue: 'Hall B', points_for_attendance: 200 });
    const cancelled = await staff('patch', `/events/${id}`).send({ status: 'CANCELLED' });
    expect(cancelled.body.data.status).toBe('CANCELLED');
    expect((await staff('patch', `/events/${id}`).send({ venue: 'x' })).body.code).toBe('NOT_EDITABLE');
    await drain();
    const told = await admin.query(`SELECT type FROM app.notifications WHERE recipient_user_id = $1`, [huda.userId]);
    expect(told.rows.map((r) => r.type)).toEqual(['event.cancelled']);

    const drafts = await staff('get', '/events?when=DRAFTS', 'EDITOR');
    expect(drafts.status).toBe(200);
    expect(contractErrors('admin', 'get', '/events', 200, drafts.body)).toEqual([]);
    expect(drafts.body.data.map((e: { id: string }) => e.id)).toEqual([concert.body.data.id]);
    expect(drafts.body.kpis.map((k: { key: string }) => k.key)).toEqual([
      'upcoming_events',
      'registrations',
      'verified_attendance',
    ]);
  });

  it('reminds registrants once, within a day of the start', async () => {
    const id = (await staff('post', '/events').send(EVENT())).body.data.id as string;
    await appRequest(app, 'put', `/events/${id}/registration`, huda);
    expect(await events.remind()).toBe(0);
    clock.advance(25 * HOUR);
    expect(await events.remind()).toBe(1);
    expect(await events.remind()).toBe(0);
    await drain();
    const sent = await admin.query(
      `SELECT type, payload->>'venue' AS venue FROM app.notifications WHERE recipient_user_id = $1`,
      [huda.userId],
    );
    expect(sent.rows).toEqual([{ type: 'event.reminder', venue: 'Boulevard Hall' }]);
  });

  it('counts the Discover header', async () => {
    await staff('post', '/events').send(EVENT());
    const counts = await appRequest(app, 'get', '/discover/counts', huda);
    expect(counts.status).toBe(200);
    expect(contractErrors('app', 'get', '/discover/counts', 200, counts.body)).toEqual([]);
    expect(counts.body.data).toEqual({ companies: 0, professionals: 0, events: 1, opportunities: 0 });
  });
});
