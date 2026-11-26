import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, CursorPageMeta, OffsetPageMeta, Page } from '../../../common/pagination';
import { EventAdminView, EventsService, RegistrationView, toAdminType } from '../../../modules/events';
import { Idempotent } from '../../../platform/idempotency';
import { presentAdminCompanySummary } from '../opportunities/admin-opportunities.controller';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /events query (validated again in the service). */
export class EventsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ['PAST', 'UPCOMING', 'DRAFTS'] })
  @IsOptional()
  @IsIn(['PAST', 'UPCOMING', 'DRAFTS'])
  when?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/** contracts/admin GET /users/{id}/events query. */
export class UserEventsQueryDto {
  @ApiPropertyOptional({ description: 'Opaque cursor from meta.next_cursor' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

/** contracts/admin `Registration`. */
function presentRegistration(r: RegistrationView) {
  return {
    id: r.id,
    event_id: r.eventId,
    status: r.status,
    pass_code: r.passCode,
    registered_at: r.registeredAt.toISOString(),
    attendance_verified_at: r.attendanceVerifiedAt?.toISOString() ?? null,
    points_awarded: r.pointsAwarded,
  };
}

/**
 * contracts/admin `EventAdmin` (with the additive `description_i18n`). Events are free
 * (`price.free`); covers and speaker photos arrive with uploads (Phase 1B).
 */
export function presentEventAdmin(v: EventAdminView) {
  return {
    id: v.id,
    title: v.title.en,
    title_i18n: v.title,
    description_i18n: v.description,
    type: toAdminType(v.type),
    topics: v.topics,
    cover_url: null,
    featured: v.featured,
    starts_at: v.startsAt.toISOString(),
    ends_at: v.endsAt.toISOString(),
    venue: v.venue,
    city: v.city,
    map_url: v.mapUrl,
    organizer: v.organizer ? presentAdminCompanySummary(v.organizer) : null,
    price: { free: true, amount: null },
    attending_count: v.attendees,
    friends_attending: 0,
    agenda: v.agenda.map((a) => ({ day: a.day, time: a.time, title: a.title.en, location: a.location })),
    speakers: v.speakers.map((s) => ({ name: s.name, title: s.title, photo_url: null })),
    points_for_attendance: v.pointsForAttendance,
    registration: null,
    status: v.status,
    capacity: v.capacity,
    registered: v.registered,
    checked_in: v.checkedIn,
    unmatched_scans: v.unmatchedScans,
    points_status: v.pointsStatus,
    check_in_method: v.checkInMethod,
  };
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {}, meta: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** Events in the back office (contracts/admin /events*). */
@ApiTags('Admin events')
@ApiCookieAuth('adminSession')
@Controller('events')
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @RequirePermission('events.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: EventsQueryDto) {
    const { items, total, kpis } = await this.events.adminList(actor, query);
    return new Page<ReturnType<typeof presentEventAdmin>, OffsetPageMeta>(
      items.map(presentEventAdmin),
      {
        page: query.page,
        page_size: query.page_size,
        total,
        total_pages: Math.max(1, Math.ceil(total / query.page_size)),
      },
      { kpis },
    );
  }

  @Post()
  @RequirePermission('events.manage')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async create(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentEventAdmin(await this.events.create(actor, body));
  }

  @Get(':id')
  @RequirePermission('events.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentEventAdmin(await this.events.adminGet(actor, id));
  }

  @Patch(':id')
  @RequirePermission('events.manage')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async update(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentEventAdmin(await this.events.update(actor, id, body));
  }

  @Get(':id/attendance')
  @RequirePermission('events.view')
  @ApiOkResponse(OK)
  async attendance(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const s = await this.events.attendance(actor, id);
    return {
      registered: s.registered,
      verified: s.verified,
      unmatched_scans: s.unmatchedScans,
      awarded: s.awarded,
      pending_award: s.pendingAward,
      points_per_attendee: s.pointsPerAttendee,
    };
  }

  @Post(':id/check-ins')
  @HttpCode(200)
  @RequirePermission('events.check_in')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async checkIn(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return this.events.checkIn(actor, id, body);
  }

  @Post(':id/award-points')
  @HttpCode(202)
  @RequirePermission('points.award_events')
  @Idempotent({ required: false })
  @ApiAcceptedResponse(OK)
  async awardPoints(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const r = await this.events.awardPoints(actor, id);
    return { awarded: r.awarded, points_each: r.pointsEach, skipped_already_awarded: r.skippedAlreadyAwarded };
  }
}

/** A member's events (contracts/admin GET /users/{id}/events). */
@ApiTags('Admin users')
@ApiCookieAuth('adminSession')
@Controller('users')
export class AdminUserEventsController {
  constructor(private readonly events: EventsService) {}

  @Get(':id/events')
  @RequirePermission('users.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Query() query: UserEventsQueryDto) {
    const { items, nextCursor } = await this.events.ofUser(actor, id, query);
    return new Page<
      { event: ReturnType<typeof presentEventAdmin>; registration: ReturnType<typeof presentRegistration> },
      CursorPageMeta
    >(
      items.map((i) => ({ event: presentEventAdmin(i.event), registration: presentRegistration(i.registration) })),
      { next_cursor: nextCursor, has_more: nextCursor !== null },
    );
  }
}
