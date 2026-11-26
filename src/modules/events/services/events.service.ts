import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { decodeCursor, encodeCursor } from '../../../common/pagination';
import { riyadhDay } from '../../../common/time/riyadh';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import { CompaniesService, CompanyCard } from '../../companies';
import { EarningRulesService, PointsService } from '../../engagement';
import {
  ADMIN_EVENT_TYPES,
  AgendaInput,
  EVENT_TYPES,
  EventType,
  fromAdminType,
  pointsStatus,
  registrationRefusal,
} from '../domain/event-rules';

const DAY_MS = 86_400_000;
const REMINDER_WINDOW_MS = DAY_MS;
const ALERT_BATCH = 500;

const localized = (max: number) =>
  z
    .object({
      en: z.string().trim().max(max, `must be at most ${max} characters`).default(''),
      ar: z.string().trim().max(max, `must be at most ${max} characters`).default(''),
    })
    .strict();

const instant = z.string().datetime({ offset: true, message: 'must be a date-time like 2026-12-01T18:00:00+03:00' });

/** contracts/admin `EventInput` (plus `status`: DRAFT, PUBLISHED or CANCELLED). */
const eventSchema = z
  .object({
    title: localized(200),
    description: localized(5000).optional(),
    type: z.enum(ADMIN_EVENT_TYPES, { error: `must be one of ${ADMIN_EVENT_TYPES.join(', ')}` }).optional(),
    topics: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
    // Uploads arrive with Phase 1B (TQ-10); the ids are accepted and not used yet.
    cover_upload_id: z.string().uuid().optional(),
    starts_at: instant,
    ends_at: instant,
    venue: z.string().trim().min(1, 'is required').max(200),
    city: z.string().trim().min(1, 'is required').max(100),
    map_url: z.string().url('must be a link').max(500).nullable().optional(),
    organizer_company_id: z.string().uuid().nullable().optional(),
    capacity: z.number().int().min(1, 'must be at least 1').max(1_000_000).nullable().optional(),
    featured: z.boolean().optional(),
    points_for_attendance: z.number().int().min(0, 'must be 0 or more').max(10_000).optional(),
    check_in_method: z.enum(['QR_SCAN', 'IMPORT']).optional(),
    agenda: z
      .array(
        z
          .object({
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-12-01'),
            time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be a time like 18:30'),
            title: localized(200),
            location: z.string().trim().max(200).default(''),
          })
          .strict(),
      )
      .max(100)
      .optional(),
    speakers: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(120),
            title: z.string().trim().max(200).default(''),
            photo_upload_id: z.string().uuid().optional(),
          })
          .strict(),
      )
      .max(50)
      .optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
  })
  .strict();

const patchSchema = eventSchema.partial();

const appListSchema = z.object({
  type: z.enum(EVENT_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

const adminListSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?(starts_at|created_at)$/, 'must be starts_at or created_at, optionally prefixed with -')
    .optional(),
  q: z.string().trim().max(100).optional(),
  when: z.enum(['PAST', 'UPCOMING', 'DRAFTS']).optional(),
  city: z.string().trim().max(100).optional(),
});

const scansSchema = z
  .object({
    scans: z
      .array(
        z
          .object({
            pass_code: z.string().trim().min(1).max(64),
            scanned_at: instant,
            gate: z.string().trim().max(60).optional(),
          })
          .strict(),
        { error: 'is required' },
      )
      .min(1, 'must have at least one scan')
      .max(1000, 'must have at most 1000 scans'),
  })
  .strict();

const cursorSchema = z.object({ cursor: z.string().max(512).optional(), limit: z.number().int().min(1).max(50) });
const CURSOR_KEYS = ['registered_at', 'id'] as const;

type EventRow = Prisma.EventGetPayload<object>;
type RegistrationRow = Prisma.EventRegistrationGetPayload<object>;

/** A speaker as staff enter it (contracts/admin `EventInput.speakers`). */
export interface SpeakerInput {
  name: string;
  title: string;
}

/** An event with its counts, before presentation (app `Event`, admin `EventAdmin`). */
export interface EventView {
  id: string;
  status: EventRow['status'];
  type: EventType;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  topics: string[];
  startsAt: Date;
  endsAt: Date;
  venue: string;
  city: string;
  mapUrl: string | null;
  organizer: CompanyCard | null;
  capacity: number | null;
  featured: boolean;
  pointsForAttendance: number;
  checkInMethod: EventRow['checkInMethod'];
  agenda: AgendaInput[];
  speakers: SpeakerInput[];
  /** Active registrations (REGISTERED or ATTENDED). */
  attendees: number;
  /** The caller's registration (members), else null. */
  registration: RegistrationView | null;
}

export interface RegistrationView {
  id: string;
  eventId: string;
  status: RegistrationRow['status'];
  passCode: string;
  registeredAt: Date;
  attendanceVerifiedAt: Date | null;
  pointsAwarded: number;
}

/** contracts/admin `EventAdmin` extras. */
export interface EventAdminView extends EventView {
  registered: number;
  checkedIn: number;
  unmatchedScans: number;
  pointsStatus: ReturnType<typeof pointsStatus>;
}

/** contracts/admin `AttendanceSummary`. */
export interface AttendanceSummaryView {
  registered: number;
  verified: number;
  unmatchedScans: number;
  awarded: number;
  pendingAward: number;
  pointsPerAttendee: number;
}

const ACTIVE: RegistrationRow['status'][] = ['REGISTERED', 'ATTENDED'];

/**
 * Events (contracts/app /events*, contracts/admin /events*, execution-plan Phase 6).
 *
 * - Members register for a QR pass; registering earns no points (BQ-77). Registration is
 *   idempotent and refused when the event is full (`EVENT_FULL`) or not open.
 * - Staff check passes in: one check-in per pass per Riyadh day; the first verifies
 *   attendance. Unknown codes are kept as unmatched scans.
 * - Awarding writes one `event_attendance:<user>:<event>` ledger entry per verified
 *   attendee through engagement, so it is safe to repeat.
 * - Jobs: `event.reminder` (once, 24 h before the start) and `event.complete` (after the end:
 *   COMPLETED, and registrations never checked in become NO_SHOW).
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly companies: CompaniesService,
    private readonly points: PointsService,
    private readonly rules: EarningRulesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  // ---- The app ----

  /** GET /events: upcoming published events, soonest first. */
  async list(actor: Actor | undefined, input: unknown): Promise<{ items: EventView[]; hasMore: boolean }> {
    const { userId } = requireMember(actor);
    const query = parseInput(appListSchema, input);
    const and: Prisma.EventWhereInput[] = [{ status: 'PUBLISHED', endsAt: { gt: this.clock.now() } }];
    if (query.type) and.push({ type: query.type });
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({
        OR: [{ titleEn: like }, { titleAr: like }, { city: like }, { venue: like }, { topics: { has: query.q } }],
      });
    }
    const rows = await this.prisma.event.findMany({
      where: { AND: and },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.page_size,
      take: query.page_size + 1,
    });
    return { items: await this.views(rows.slice(0, query.page_size), userId), hasMore: rows.length > query.page_size };
  }

  /** GET /events/{id}: any event that is not a draft. */
  async get(actor: Actor | undefined, eventId: string): Promise<EventView> {
    const { userId } = requireMember(actor);
    return (await this.views([await this.findVisible(eventId)], userId))[0];
  }

  /** How many upcoming published events there are (contracts/app `DiscoverCounts.events`). */
  async upcomingCount(): Promise<number> {
    return this.prisma.event.count({ where: { status: 'PUBLISHED', endsAt: { gt: this.clock.now() } } });
  }

  /** PUT /events/{id}/registration. Idempotent; a cancelled registration comes back with a new pass. */
  async register(actor: Actor | undefined, eventId: string): Promise<EventView> {
    const { userId } = requireMember(actor);
    const event = await this.findVisible(eventId);
    await this.transactions.run(async (tx) => {
      // Lock the event so capacity holds under concurrent registrations.
      await tx.$queryRaw`SELECT 1 FROM app.events WHERE id = ${event.id}::uuid FOR UPDATE`;
      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
      });
      if (existing && ACTIVE.includes(existing.status)) return;
      const fresh = (await tx.event.findUnique({ where: { id: event.id } }))!;
      const taken = await tx.eventRegistration.count({ where: { eventId: event.id, status: { in: ACTIVE } } });
      const refusal = registrationRefusal(fresh, taken, this.clock.now());
      if (refusal === 'EVENT_FULL') {
        throw new DomainError(ErrorCode.EVENT_FULL, 'This event is full', HttpStatus.CONFLICT);
      }
      if (refusal === 'CLOSED') {
        throw new DomainError(
          ErrorCode.INVALID_TRANSITION,
          'Registration for this event is closed',
          HttpStatus.CONFLICT,
        );
      }
      const now = this.clock.now();
      const passCode = newPassCode();
      const registration = existing
        ? await tx.eventRegistration.update({
            where: { id: existing.id },
            data: { status: 'REGISTERED', passCode, registeredAt: now, cancelledAt: null },
          })
        : await tx.eventRegistration.create({
            data: { id: uuidv7(now.getTime()), eventId: event.id, userId, passCode, registeredAt: now },
          });
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'event.register',
        entityType: 'event_registration',
        entityId: registration.id,
        changes: { after: { event_id: event.id, status: 'REGISTERED' } },
      });
    });
    return this.get(actor, eventId);
  }

  /** DELETE /events/{id}/registration. Idempotent; an attended registration stays. */
  async cancel(actor: Actor | undefined, eventId: string): Promise<EventView> {
    const { userId } = requireMember(actor);
    const event = await this.findVisible(eventId);
    await this.transactions.run(async (tx) => {
      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
      });
      if (!existing || existing.status !== 'REGISTERED') return;
      await tx.eventRegistration.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED', cancelledAt: this.clock.now() },
      });
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'event.registration.cancel',
        entityType: 'event_registration',
        entityId: existing.id,
        changes: { before: { status: 'REGISTERED' }, after: { status: 'CANCELLED' } },
      });
    });
    return this.get(actor, eventId);
  }

  // ---- The back office ----

  /** GET /events (`events.view`) with KPIs. */
  async adminList(
    actor: Actor | undefined,
    input: unknown,
  ): Promise<{
    items: EventAdminView[];
    total: number;
    kpis: { key: string; label: string; value: number; display: string }[];
  }> {
    this.requireStaff(actor, 'events.view');
    const query = parseInput(adminListSchema, input);
    const now = this.clock.now();
    const and: Prisma.EventWhereInput[] = [];
    if (query.when === 'DRAFTS') and.push({ status: 'DRAFT' });
    if (query.when === 'UPCOMING') and.push({ status: { not: 'DRAFT' }, endsAt: { gt: now } });
    if (query.when === 'PAST') and.push({ status: { not: 'DRAFT' }, endsAt: { lte: now } });
    if (query.city) and.push({ city: { equals: query.city, mode: 'insensitive' } });
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({ OR: [{ titleEn: like }, { titleAr: like }, { venue: like }] });
    }
    const where: Prisma.EventWhereInput = { AND: and };
    const sort = query.sort ?? (query.when === 'PAST' ? '-starts_at' : 'starts_at');
    const field = sort.replace(/^-/, '') === 'created_at' ? 'createdAt' : 'startsAt';
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const [rows, total, upcoming, registrations, attended] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: [{ [field]: direction }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.event.count({ where }),
      this.upcomingCount(),
      this.prisma.eventRegistration.count({ where: { status: { in: ACTIVE } } }),
      this.prisma.eventRegistration.count({ where: { status: 'ATTENDED' } }),
    ]);
    const kpi = (key: string, label: string, value: number) => ({ key, label, value, display: String(value) });
    return {
      items: await this.adminViews(rows),
      total,
      kpis: [
        kpi('upcoming_events', 'Upcoming events', upcoming),
        kpi('registrations', 'Registrations', registrations),
        kpi('verified_attendance', 'Verified attendance', attended),
      ],
    };
  }

  async adminGet(actor: Actor | undefined, eventId: string): Promise<EventAdminView> {
    this.requireStaff(actor, 'events.view');
    return (await this.adminViews([await this.findAny(eventId)]))[0];
  }

  /** POST /events (`events.manage`). A DRAFT unless `status` says PUBLISHED. */
  async create(actor: Actor | undefined, input: unknown): Promise<EventAdminView> {
    const staff = this.requireStaff(actor, 'events.manage');
    const data = parseInput(eventSchema, input);
    this.checkContent(data);
    await this.requireOrganizer(data.organizer_company_id);
    const defaultPoints = (await this.rules.pointsFor('EVENT_ATTENDANCE')) ?? 0;
    const now = this.clock.now();
    const id = uuidv7(now.getTime());
    const status = data.status ?? 'DRAFT';
    await this.transactions.run(async (tx) => {
      await tx.event.create({
        data: {
          id,
          ...this.columns(data),
          pointsForAttendance: data.points_for_attendance ?? defaultPoints,
          status,
          publishedAt: status === 'DRAFT' ? null : now,
        } as Prisma.EventUncheckedCreateInput,
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'event.create',
        entityType: 'event',
        entityId: id,
        changes: { after: { status, title: data.title.en } },
      });
    });
    return this.adminGet(actor, id);
  }

  /** PATCH /events/{id} (`events.manage`). A completed event no longer changes. */
  async update(actor: Actor | undefined, eventId: string, input: unknown): Promise<EventAdminView> {
    const staff = this.requireStaff(actor, 'events.manage');
    const data = parseInput(patchSchema, input ?? {});
    await this.requireOrganizer(data.organizer_company_id);
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, eventId);
      if (row.status === 'COMPLETED' || row.status === 'CANCELLED') {
        throw new DomainError(
          ErrorCode.NOT_EDITABLE,
          `A ${row.status.toLowerCase()} event cannot be edited`,
          HttpStatus.CONFLICT,
        );
      }
      if (data.status === 'DRAFT' && row.status !== 'DRAFT') {
        throw new DomainError(
          ErrorCode.INVALID_TRANSITION,
          'A published event cannot go back to draft',
          HttpStatus.CONFLICT,
        );
      }
      const merged = {
        title: data.title ?? { en: row.titleEn, ar: row.titleAr },
        starts_at: data.starts_at ?? row.startsAt.toISOString(),
        ends_at: data.ends_at ?? row.endsAt.toISOString(),
      };
      this.checkContent(merged);
      const now = this.clock.now();
      await tx.event.update({
        where: { id: row.id },
        data: {
          ...this.columns(data),
          ...(data.points_for_attendance !== undefined ? { pointsForAttendance: data.points_for_attendance } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.status && data.status !== 'DRAFT' && !row.publishedAt ? { publishedAt: now } : {}),
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: data.status === 'CANCELLED' ? 'event.cancel' : 'event.update',
        entityType: 'event',
        entityId: row.id,
        changes: {
          before: { status: row.status },
          after: { status: data.status ?? row.status, fields: Object.keys(data) },
        },
      });
      if (data.status === 'CANCELLED') await this.alertRegistrants(tx, row, 'event.cancelled');
    });
    return this.adminGet(actor, eventId);
  }

  /** GET /events/{id}/attendance (`events.view`). */
  async attendance(actor: Actor | undefined, eventId: string): Promise<AttendanceSummaryView> {
    this.requireStaff(actor, 'events.view');
    const event = await this.findAny(eventId);
    return this.summarize(event);
  }

  /**
   * POST /events/{id}/check-ins (`events.check_in`). Idempotent per pass and Riyadh day; the
   * first check-in verifies attendance. Codes of no active registration are unmatched.
   */
  async checkIn(
    actor: Actor | undefined,
    eventId: string,
    input: unknown,
  ): Promise<{ matched: number; unmatched: number; duplicates: number }> {
    const staff = this.requireStaff(actor, 'events.check_in');
    const { scans } = parseInput(scansSchema, input);
    const event = await this.findAny(eventId);
    if (event.status === 'DRAFT' || event.status === 'CANCELLED') {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        `A ${event.status.toLowerCase()} event takes no check-ins`,
        HttpStatus.CONFLICT,
      );
    }
    const result = { matched: 0, unmatched: 0, duplicates: 0 };
    await this.transactions.run(async (tx) => {
      for (const scan of scans) {
        const at = new Date(scan.scanned_at);
        const registration = await tx.eventRegistration.findFirst({
          where: { eventId: event.id, passCode: scan.pass_code, status: { in: ['REGISTERED', 'ATTENDED', 'NO_SHOW'] } },
        });
        if (!registration) {
          const stored = await tx.eventUnmatchedScan.createMany({
            data: [{ eventId: event.id, passCode: scan.pass_code, scannedAt: at, gate: scan.gate ?? null }],
            skipDuplicates: true,
          });
          if (stored.count === 0) result.duplicates += 1;
          else result.unmatched += 1;
          continue;
        }
        const created = await tx.eventCheckIn.createMany({
          data: [
            {
              registrationId: registration.id,
              day: new Date(`${riyadhDay(at)}T00:00:00Z`),
              scannedAt: at,
              gate: scan.gate ?? null,
            },
          ],
          skipDuplicates: true,
        });
        if (created.count === 0) {
          result.duplicates += 1;
          continue;
        }
        result.matched += 1;
        if (registration.status !== 'ATTENDED') {
          await tx.eventRegistration.update({
            where: { id: registration.id },
            data: { status: 'ATTENDED', attendanceVerifiedAt: at },
          });
          await this.outbox.emit({
            name: 'event.attendance.verified',
            aggregateType: 'event',
            aggregateId: event.id,
            actor: { type: 'STAFF', user_id: staff.staffId },
            data: { event_id: event.id, registration_id: registration.id, user_id: registration.userId },
          });
        }
      }
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'event.check_in',
        entityType: 'event',
        entityId: event.id,
        changes: { after: { scans: scans.length, ...result } },
      });
    });
    return result;
  }

  /**
   * POST /events/{id}/award-points (`points.award_events`). One ledger entry per verified
   * attendee, keyed per member and event, so a repeat skips those already awarded.
   */
  async awardPoints(
    actor: Actor | undefined,
    eventId: string,
  ): Promise<{ awarded: number; pointsEach: number; skippedAlreadyAwarded: number }> {
    const staff = this.requireStaff(actor, 'points.award_events');
    const event = await this.findAny(eventId);
    if (event.status === 'DRAFT' || event.status === 'CANCELLED') {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        `A ${event.status.toLowerCase()} event awards no points`,
        HttpStatus.CONFLICT,
      );
    }
    const attendees = await this.prisma.eventRegistration.findMany({
      where: { eventId: event.id, status: 'ATTENDED' },
      orderBy: { attendanceVerifiedAt: 'asc' },
    });
    let awarded = 0;
    let skipped = 0;
    for (const registration of attendees) {
      if (event.pointsForAttendance === 0 || registration.pointsAwarded > 0) {
        skipped += 1;
        continue;
      }
      await this.transactions.run(async (tx) => {
        const entry = await this.points.credit({
          userId: registration.userId,
          amount: event.pointsForAttendance,
          type: 'EVENT_ATTENDANCE',
          title: event.titleEn,
          subtitle: event.venue,
          source: { type: 'event', id: event.id },
          idempotencyKey: `event_attendance:${registration.userId}:${event.id}`,
        });
        if (entry) {
          await tx.eventRegistration.update({
            where: { id: registration.id },
            data: { pointsAwarded: event.pointsForAttendance },
          });
          awarded += 1;
        } else {
          skipped += 1;
        }
      });
    }
    await this.transactions.run(async () => {
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'event.award_points',
        entityType: 'event',
        entityId: event.id,
        changes: { after: { awarded, skipped, points_each: event.pointsForAttendance } },
      });
    });
    return { awarded, pointsEach: event.pointsForAttendance, skippedAlreadyAwarded: skipped };
  }

  /** GET /users/{id}/events (`users.view`): the member's registrations, newest first. */
  async ofUser(
    actor: Actor | undefined,
    userId: string,
    input: unknown,
  ): Promise<{ items: { event: EventAdminView; registration: RegistrationView }[]; nextCursor: string | null }> {
    this.requireStaff(actor, 'users.view');
    const query = parseInput(cursorSchema, input);
    if (!isUuid(userId) || (await this.prisma.user.count({ where: { id: userId } })) === 0) {
      throw new NotFoundError('User not found');
    }
    const after = query.cursor ? decodeCursor(query.cursor, CURSOR_KEYS) : null;
    const rows = await this.prisma.eventRegistration.findMany({
      where: {
        userId,
        ...(after
          ? {
              OR: [
                { registeredAt: { lt: new Date(String(after.registered_at)) } },
                { registeredAt: new Date(String(after.registered_at)), id: { lt: String(after.id) } },
              ],
            }
          : {}),
      },
      include: { event: true },
      orderBy: [{ registeredAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const page = rows.slice(0, query.limit);
    const events = await this.adminViews(page.map((r) => r.event));
    const last = rows.length > query.limit ? page[page.length - 1] : null;
    return {
      items: page.map((r, i) => ({ event: events[i], registration: registrationView(r) })),
      nextCursor: last ? encodeCursor({ registered_at: last.registeredAt.toISOString(), id: last.id }) : null,
    };
  }

  // ---- Jobs ----

  /** `event.reminder`: once per event, within 24 h of the start, to everyone registered. */
  async remind(): Promise<number> {
    const now = this.clock.now();
    const due = await this.prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        remindedAt: null,
        startsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) },
      },
    });
    for (const event of due) {
      await this.transactions.run(async (tx) => {
        const fresh = await this.lock(tx, event.id);
        if (fresh.remindedAt) return;
        await tx.event.update({ where: { id: event.id }, data: { remindedAt: now } });
        await this.alertRegistrants(tx, fresh, 'event.reminder');
      });
    }
    return due.length;
  }

  /** `event.complete`: events past their end become COMPLETED; passes never scanned, NO_SHOW. */
  async complete(): Promise<number> {
    const ended = await this.prisma.event.findMany({
      where: { status: 'PUBLISHED', endsAt: { lte: this.clock.now() } },
      select: { id: true },
    });
    for (const { id } of ended) {
      await this.transactions.run(async (tx) => {
        const event = await this.lock(tx, id);
        if (event.status !== 'PUBLISHED') return;
        await tx.event.update({ where: { id }, data: { status: 'COMPLETED' } });
        await tx.eventRegistration.updateMany({
          where: { eventId: id, status: 'REGISTERED' },
          data: { status: 'NO_SHOW' },
        });
        await this.outbox.emit({
          name: 'event.completed',
          aggregateType: 'event',
          aggregateId: id,
          actor: { type: 'SYSTEM', user_id: null },
          data: { event_id: id },
        });
      });
    }
    return ended.length;
  }

  // ---- Shared ----

  /** Announces a reminder or a cancellation to the active registrants, in batches. */
  private async alertRegistrants(tx: Tx, event: EventRow, name: 'event.reminder' | 'event.cancelled'): Promise<void> {
    const registrants = await tx.eventRegistration.findMany({
      where: { eventId: event.id, status: { in: ACTIVE } },
      select: { userId: true },
    });
    for (let i = 0; i < registrants.length; i += ALERT_BATCH) {
      await this.outbox.emit({
        name,
        aggregateType: 'event',
        aggregateId: event.id,
        actor: { type: 'SYSTEM', user_id: null },
        data: {
          event_id: event.id,
          title_en: event.titleEn,
          title_ar: event.titleAr || event.titleEn,
          starts_at: event.startsAt.toISOString(),
          venue: event.venue,
          user_ids: registrants.slice(i, i + ALERT_BATCH).map((r) => r.userId),
        },
      });
    }
  }

  private checkContent(data: { title: { en: string; ar: string }; starts_at: string; ends_at: string }): void {
    const errors: Record<string, string[]> = {};
    if (!data.title.en) errors['title.en'] = ['is required'];
    if (Date.parse(data.ends_at) <= Date.parse(data.starts_at)) errors.ends_at = ['must be after starts_at'];
    if (Object.keys(errors).length > 0) throw new ValidationFailedError(errors);
  }

  private columns(data: z.infer<typeof patchSchema>): Prisma.EventUncheckedUpdateInput {
    return {
      ...(data.title ? { titleEn: data.title.en, titleAr: data.title.ar } : {}),
      ...(data.description ? { descriptionEn: data.description.en, descriptionAr: data.description.ar } : {}),
      ...(data.type ? { type: fromAdminType(data.type) } : {}),
      ...(data.topics ? { topics: data.topics } : {}),
      ...(data.starts_at ? { startsAt: new Date(data.starts_at) } : {}),
      ...(data.ends_at ? { endsAt: new Date(data.ends_at) } : {}),
      ...(data.venue ? { venue: data.venue } : {}),
      ...(data.city ? { city: data.city } : {}),
      ...(data.map_url !== undefined ? { mapUrl: data.map_url } : {}),
      ...(data.organizer_company_id !== undefined ? { organizerCompanyId: data.organizer_company_id } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.check_in_method ? { checkInMethod: data.check_in_method } : {}),
      ...(data.agenda ? { agenda: data.agenda as unknown as Prisma.InputJsonArray } : {}),
      ...(data.speakers
        ? { speakers: data.speakers.map((s) => ({ name: s.name, title: s.title })) as unknown as Prisma.InputJsonArray }
        : {}),
    };
  }

  private async requireOrganizer(companyId: string | null | undefined): Promise<void> {
    if (companyId && !(await this.companies.card(companyId))) {
      throw new ValidationFailedError({ organizer_company_id: ['is not a company'] });
    }
  }

  private async summarize(event: EventRow): Promise<AttendanceSummaryView> {
    const [registered, verified, awarded, unmatched] = await Promise.all([
      this.prisma.eventRegistration.count({ where: { eventId: event.id, status: { not: 'CANCELLED' } } }),
      this.prisma.eventRegistration.count({ where: { eventId: event.id, status: 'ATTENDED' } }),
      this.prisma.eventRegistration.count({
        where: { eventId: event.id, status: 'ATTENDED', pointsAwarded: { gt: 0 } },
      }),
      this.prisma.eventUnmatchedScan.count({ where: { eventId: event.id } }),
    ]);
    return {
      registered,
      verified,
      unmatchedScans: unmatched,
      awarded,
      pendingAward: event.pointsForAttendance > 0 ? verified - awarded : 0,
      pointsPerAttendee: event.pointsForAttendance,
    };
  }

  private async views(rows: EventRow[], viewerUserId: string | null): Promise<EventView[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [cards, counts, mine] = await Promise.all([
      this.companies.cards(rows.map((r) => r.organizerCompanyId).filter((id): id is string => id !== null)),
      this.prisma.eventRegistration.groupBy({
        by: ['eventId'],
        where: { eventId: { in: ids }, status: { in: ACTIVE } },
        _count: true,
      }),
      viewerUserId
        ? this.prisma.eventRegistration.findMany({ where: { eventId: { in: ids }, userId: viewerUserId } })
        : [],
    ]);
    const attendees = new Map(counts.map((c) => [c.eventId, c._count]));
    const registrations = new Map(mine.map((r) => [r.eventId, r]));
    return rows.map((row) => {
      const registration = registrations.get(row.id);
      return {
        id: row.id,
        status: row.status,
        type: row.type,
        title: { en: row.titleEn, ar: row.titleAr },
        description: { en: row.descriptionEn, ar: row.descriptionAr },
        topics: row.topics,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        venue: row.venue,
        city: row.city,
        mapUrl: row.mapUrl,
        organizer: row.organizerCompanyId ? (cards.get(row.organizerCompanyId) ?? null) : null,
        capacity: row.capacity,
        featured: row.featured,
        pointsForAttendance: row.pointsForAttendance,
        checkInMethod: row.checkInMethod,
        agenda: row.agenda as unknown as AgendaInput[],
        speakers: row.speakers as unknown as SpeakerInput[],
        attendees: attendees.get(row.id) ?? 0,
        registration: registration ? registrationView(registration) : null,
      };
    });
  }

  private async adminViews(rows: EventRow[]): Promise<EventAdminView[]> {
    const base = await this.views(rows, null);
    const now = this.clock.now();
    return Promise.all(
      rows.map(async (row, i) => {
        const summary = await this.summarize(row);
        return {
          ...base[i],
          registered: summary.registered,
          checkedIn: summary.verified,
          unmatchedScans: summary.unmatchedScans,
          pointsStatus: pointsStatus(row.startsAt, now, summary.verified, summary.awarded),
        };
      }),
    );
  }

  /** An event members may open: anything but a draft. */
  private async findVisible(eventId: string): Promise<EventRow> {
    const row = isUuid(eventId)
      ? await this.prisma.event.findFirst({ where: { id: eventId, status: { not: 'DRAFT' } } })
      : null;
    if (!row) throw new NotFoundError('Event not found');
    return row;
  }

  private async findAny(eventId: string): Promise<EventRow> {
    const row = isUuid(eventId) ? await this.prisma.event.findUnique({ where: { id: eventId } }) : null;
    if (!row) throw new NotFoundError('Event not found');
    return row;
  }

  private async lock(tx: Tx, eventId: string): Promise<EventRow> {
    if (!isUuid(eventId)) throw new NotFoundError('Event not found');
    await tx.$queryRaw`SELECT 1 FROM app.events WHERE id = ${eventId}::uuid FOR UPDATE`;
    const row = await tx.event.findUnique({ where: { id: eventId } });
    if (!row) throw new NotFoundError('Event not found');
    return row;
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

function registrationView(r: RegistrationRow): RegistrationView {
  return {
    id: r.id,
    eventId: r.eventId,
    status: r.status,
    passCode: r.passCode,
    registeredAt: r.registeredAt,
    attendanceVerifiedAt: r.attendanceVerifiedAt,
    pointsAwarded: r.pointsAwarded,
  };
}

/** BOH-XXXX-XXXX from an unambiguous alphabet (no 0/O, 1/I). */
function newPassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]);
  return `BOH-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}
