import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import {
  ApplicantApplicationView,
  ApplicationsService,
  ApplicationView,
  MyApplicationView,
} from '../../../modules/opportunities';
import { CompanyAccountOnly, IndividualsOnly } from '../account-context';
import { presentExperience, presentProfileProject } from '../directory/app-presenters';
import { presentCompanySummary } from './app-opportunity.presenters';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** contracts/app GET /company/applicants/recent query. */
export class RecentApplicantsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 5;
}

/** contracts/app `ApplicantSnapshot`. Avatars arrive with uploads (1B). */
function presentApplicant(v: ApplicationView) {
  const a = v.applicant;
  return {
    name: a.name,
    headline: a.headline,
    profile_status: a.profileStatus,
    // Verification state only: 1 once a reviewer approved (as on the profile).
    verification_level: a.verified ? 1 : 0,
    verified: a.verified,
    city: a.city,
    skills: a.skills,
    avatar_url: null,
  };
}

/** contracts/app `Application` (the applicant's view). */
export function presentApplication(v: MyApplicationView) {
  return {
    id: v.id,
    reference: v.reference,
    opportunity_id: v.opportunityId,
    opportunity_title: v.listing.title,
    opportunity_type: v.listing.type,
    company: presentCompanySummary(v.company),
    city: v.listing.city,
    employment_type: v.listing.employmentType,
    compensation: v.listing.compensation,
    status: v.status,
    submitted_at: v.submittedAt.toISOString(),
    updated_at: v.updatedAt.toISOString(),
    applicant: presentApplicant(v),
    message: v.message,
    experience: v.experience.map(presentExperience),
    projects: v.projects.map(presentProfileProject),
  };
}

/** contracts/app `ApplicantView` (the owning company's view). */
export function presentApplicantView(v: ApplicantApplicationView) {
  return {
    application_id: v.id,
    reference: v.reference,
    opportunity_id: v.opportunityId,
    opportunity_title: v.listing.title,
    status: v.status,
    submitted_at: v.submittedAt.toISOString(),
    updated_at: v.updatedAt.toISOString(),
    applicant: presentApplicant(v),
    experience: v.experience.map(presentExperience),
    projects: v.projects.map(presentProfileProject),
    message: v.message,
    contact: v.contact,
  };
}

/** The individual's applications (contracts/app /me/applications*). Individuals only. */
@ApiTags('Me')
@ApiBearerAuth()
@IndividualsOnly()
@Controller('me/applications')
export class AppMyApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined) {
    return (await this.applications.mine(actor)).map(presentApplication);
  }

  @Post()
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async apply(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentApplication(await this.applications.apply(actor, body, RequestContext.locale()));
  }

  @Post(':id/withdraw')
  @HttpCode(200)
  @ApiOkResponse(OK)
  async withdraw(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentApplication(await this.applications.withdraw(actor, id));
  }
}

/**
 * Applicants to the Company Account's own listings (contracts/app /company/applicants*,
 * /company/opportunities/{id}/applicants). Needs `REVIEW_APPLICANTS`; another company's
 * application is 404.
 */
@ApiTags('Company')
@ApiBearerAuth()
@CompanyAccountOnly('REVIEW_APPLICANTS')
@Controller('company')
export class AppCompanyApplicantsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get('opportunities/:id/applicants')
  @ApiOkResponse(OK)
  async forListing(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.applications.forListing(actor, id)).map(presentApplicantView);
  }

  @Get('applicants/recent')
  @ApiOkResponse(OK)
  async recent(@CurrentActor() actor: Actor | undefined, @Query() query: RecentApplicantsQueryDto) {
    return (await this.applications.recent(actor, query)).map(presentApplicantView);
  }

  @Get('applicants/:id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentApplicantView(await this.applications.getForCompany(actor, id));
  }

  @Post('applicants/:id/status')
  @HttpCode(200)
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async changeStatus(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentApplicantView(await this.applications.changeStatus(actor, id, body));
  }
}
