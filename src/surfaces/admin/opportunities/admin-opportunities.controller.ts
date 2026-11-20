import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage } from '../../../common/pagination';
import { adminCategoryOf, type CompanyCard } from '../../../modules/companies';
import { OPPORTUNITY_TYPES, OpportunityAdminView, OpportunityReviewService } from '../../../modules/opportunities';
import { RequirePermission } from '../require-permission.decorator';

const ADMIN_STATUSES = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'REJECTED', 'CLOSED'];

/** contracts/admin GET /opportunities query (validated again in the service). */
export class OpportunitiesQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ADMIN_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: OPPORTUNITY_TYPES })
  @IsOptional()
  @IsIn(OPPORTUNITY_TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  company_id?: string;
}

/** contracts/admin GET /companies/{id}/opportunities query. */
export class CompanyOpportunitiesQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_STATUSES)
  status?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** contracts/admin `CompanySummary`. */
export function presentAdminCompanySummary(c: CompanyCard) {
  const category = adminCategoryOf(c.companyType);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    logo_url: null,
    ...(category ? { category } : {}),
    industry: null,
    city: c.city || null,
    verified: c.isVerified,
  };
}

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

/**
 * contracts/admin `OpportunityAdmin`. Pay is free text in the app (`compensation`), so it
 * arrives as the range's `note`; there are no working hours or supplier budget fields yet
 * (BQ-92). PAUSED and ARCHIVED, which nothing sets yet, read as CLOSED.
 */
export function presentOpportunityAdmin(v: OpportunityAdminView) {
  const c = v.content;
  return {
    id: v.id,
    type: c.type,
    title: c.title,
    summary: c.summary,
    company: presentAdminCompanySummary(v.company),
    city: c.city,
    ...(c.workSetup ? { setup: c.workSetup } : {}),
    employment: c.employmentType,
    contract_length: c.duration,
    pay: c.compensation ? { min: null, max: null, currency: 'SAR', note: c.compensation } : null,
    working_hours: null,
    description: c.description,
    requirements: c.requirements,
    closes_at: isoDay(c.closesAt),
    crafts: c.skills,
    supplier_types: c.supplierTypes,
    status: v.status === 'PAUSED' || v.status === 'ARCHIVED' ? 'CLOSED' : v.status,
    published_at: v.publishedAt?.toISOString() ?? null,
    supplier: null,
    eligibility: null,
    submitted_at: v.submittedAt?.toISOString() ?? null,
    review_due_at: v.reviewDueAt?.toISOString() ?? null,
    sla_state: v.slaState,
    resubmitted: v.resubmitted,
    auto_flagged: v.autoFlagged,
    checks: v.checks,
    history: v.history.map((h) => ({
      id: h.id,
      decision: h.decision,
      revision: h.revision,
      reasons: h.reasons,
      message: h.message,
      reviewer: h.reviewer,
      created_at: h.createdAt.toISOString(),
    })),
    applications_count: v.applicationsCount,
    views: v.views,
    is_revision: v.revision?.status === 'IN_REVIEW',
    revision: v.revision
      ? {
          status: v.revision.status,
          changes: v.revision.changes.map((ch) => ({
            field: ch.field,
            before: ch.before,
            after: ch.after,
          })),
        }
      : null,
    updated_at: v.updatedAt.toISOString(),
  };
}

/** Listing review (contracts/admin /opportunities*). */
@ApiTags('Admin opportunities')
@ApiCookieAuth('adminSession')
@Controller('opportunities')
export class AdminOpportunitiesController {
  constructor(private readonly reviews: OpportunityReviewService) {}

  @Get()
  @RequirePermission('opportunities.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: OpportunitiesQueryDto) {
    const { items, total } = await this.reviews.list(actor, query);
    return adminPage(items.map(presentOpportunityAdmin), query, total);
  }

  @Get(':id')
  @RequirePermission('opportunities.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunityAdmin(await this.reviews.get(actor, id));
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('opportunities.review')
  @ApiOkResponse(OK)
  async approve(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunityAdmin(await this.reviews.approve(actor, id, body));
  }

  @Post(':id/request-changes')
  @HttpCode(200)
  @RequirePermission('opportunities.review')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async requestChanges(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunityAdmin(await this.reviews.requestChanges(actor, id, body));
  }

  @Post(':id/reject')
  @HttpCode(200)
  @RequirePermission('opportunities.review')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async reject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunityAdmin(await this.reviews.reject(actor, id, body));
  }

  @Post(':id/close')
  @HttpCode(200)
  @RequirePermission('moderation.act')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async close(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunityAdmin(await this.reviews.close(actor, id, body));
  }
}

/** contracts/admin GET /companies/{id}/opportunities (company detail). */
@ApiTags('Admin companies')
@ApiCookieAuth('adminSession')
@Controller('companies')
export class AdminCompanyOpportunitiesController {
  constructor(private readonly reviews: OpportunityReviewService) {}

  @Get(':id/opportunities')
  @RequirePermission('companies.view')
  @ApiOkResponse(OK)
  async list(
    @CurrentActor() actor: Actor | undefined,
    @Param('id') id: string,
    @Query() query: CompanyOpportunitiesQueryDto,
  ) {
    const { items, total } = await this.reviews.ofCompany(actor, id, query);
    return adminPage(items.map(presentOpportunityAdmin), query, total);
  }
}
