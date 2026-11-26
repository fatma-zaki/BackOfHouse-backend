import { Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import type { Locale } from '../../../common/i18n/locale';
import { AppPageMeta, AppPaginationQueryDto, Page } from '../../../common/pagination';
import { riyadhDay } from '../../../common/time/riyadh';
import { CompaniesService } from '../../../modules/companies';
import { appAgendaSlot, EVENT_TYPES, EventsService, EventView } from '../../../modules/events';
import { OpportunitiesService } from '../../../modules/opportunities';
import { VerificationReviewService } from '../../../modules/verification';
import { IndividualsOnly } from '../account-context';

/** contracts/app GET /events query. */
export class EventListQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: EVENT_TYPES })
  @IsOptional()
  @IsIn(EVENT_TYPES)
  type?: string;

  @ApiPropertyOptional({ description: 'Free-text search, case-insensitive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

const text = (value: { en: string; ar: string }, locale: Locale) => (locale === 'ar' && value.ar ? value.ar : value.en);

/**
 * contracts/app `Event`, in the request language. Accreditation, images and network peers
 * are not recorded yet (false, null, 0); there is no match score. Agenda slots carry a
 * start time only.
 */
export function presentEvent(v: EventView, locale: Locale) {
  const firstDay = riyadhDay(v.startsAt);
  return {
    id: v.id,
    title: text(v.title, locale),
    type: v.type,
    starts_at: v.startsAt.toISOString(),
    ends_at: v.endsAt.toISOString(),
    city: v.city,
    venue: v.venue,
    organizer: v.organizer?.name ?? 'Back of House',
    organizer_verified: v.organizer?.isVerified ?? true,
    description: text(v.description, locale),
    topics: v.topics,
    attendees: v.attendees,
    image_url: null,
    is_registered: v.registration !== null && ['REGISTERED', 'ATTENDED'].includes(v.registration.status),
    pass_code:
      v.registration && ['REGISTERED', 'ATTENDED'].includes(v.registration.status) ? v.registration.passCode : null,
    accredited: false,
    flagship: v.featured,
    points_reward: v.pointsForAttendance,
    network_peers: 0,
    match_score: null,
    speakers: v.speakers.map((s) => ({ name: s.name, role: s.title, organization: '', photo_url: null, host: false })),
    agenda: v.agenda.map((item) => {
      const slot = appAgendaSlot(item, firstDay);
      return {
        day: slot.day,
        starts_at: slot.at.toISOString(),
        ends_at: slot.at.toISOString(),
        title: text(item.title, locale),
        description: item.location,
        format: null,
        keynote: false,
      };
    }),
  };
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

/** Events and the Discover header (contracts/app /events*, /discover/counts). Individuals only. */
@ApiTags('Discover')
@ApiBearerAuth()
@IndividualsOnly()
@Controller()
export class AppEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly companies: CompaniesService,
    private readonly verification: VerificationReviewService,
    private readonly opportunities: OpportunitiesService,
  ) {}

  @Get('events')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: EventListQueryDto) {
    const { items, hasMore } = await this.events.list(actor, query);
    const locale = RequestContext.locale();
    return new Page<ReturnType<typeof presentEvent>, AppPageMeta>(
      items.map((e) => presentEvent(e, locale)),
      { page: query.page, page_size: query.page_size, has_more: hasMore },
    );
  }

  @Get('events/:id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentEvent(await this.events.get(actor, id), RequestContext.locale());
  }

  @Put('events/:id/registration')
  @ApiOkResponse(OK)
  async register(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentEvent(await this.events.register(actor, id), RequestContext.locale());
  }

  @Delete('events/:id/registration')
  @ApiOkResponse(OK)
  async cancel(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentEvent(await this.events.cancel(actor, id), RequestContext.locale());
  }

  /** contracts/app `DiscoverCounts`. */
  @Get('discover/counts')
  @ApiOkResponse(OK)
  async counts() {
    const [companies, professionals, events, opportunities] = await Promise.all([
      this.companies.verifiedCount(),
      this.verification.verifiedMemberCount(),
      this.events.upcomingCount(),
      this.opportunities.discoverableCount(),
    ]);
    return { companies, professionals, events, opportunities };
  }
}
