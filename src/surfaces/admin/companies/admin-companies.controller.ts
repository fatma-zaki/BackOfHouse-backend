import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, OffsetPageMeta, Page } from '../../../common/pagination';
import { CompaniesAdminService, CompanyAdminView } from '../../../modules/companies';
import { MembersService } from '../../../modules/identity';
import { VerificationReviewService } from '../../../modules/verification';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /companies query (validated again in the service). */
export class CompaniesQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** contracts/admin `CompanyAdmin`. Opportunity figures fill in with Phase 5. */
export function presentCompanyAdmin(c: CompanyAdminView) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    logo_url: null,
    ...(c.category ? { category: c.category } : {}),
    industry: c.industry,
    city: c.city,
    verified: c.verified,
    cr_number: null,
    status: c.status,
    verification: c.verification,
    verified_at: c.verifiedAt?.toISOString() ?? null,
    verified_by: c.verifiedBy,
    featured_to_watch: c.featuredToWatch,
    featured_order: c.featuredOrder,
    live_opportunities: 0,
    applications: 0,
    reply_rate: 0,
    avg_reply_days: null,
    followers: c.followers,
    team_size: c.teamSize,
    source: c.source,
    created_at: c.createdAt.toISOString(),
  };
}

/** Companies in the back office (contracts/admin /companies*). */
@ApiTags('Admin companies')
@ApiCookieAuth('adminSession')
@Controller('companies')
export class AdminCompaniesController {
  constructor(
    private readonly companies: CompaniesAdminService,
    private readonly members: MembersService,
    private readonly verification: VerificationReviewService,
  ) {}

  @Get()
  @RequirePermission('companies.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: CompaniesQueryDto) {
    const { items, total, kpis } = await this.companies.list(actor, query);
    return new Page<ReturnType<typeof presentCompanyAdmin>, OffsetPageMeta>(
      items.map(presentCompanyAdmin),
      {
        page: query.page,
        page_size: query.page_size,
        total,
        total_pages: Math.max(1, Math.ceil(total / query.page_size)),
      },
      { kpis },
    );
  }

  @Get(':id')
  @RequirePermission('companies.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const { company, kpis, allowedActions } = await this.companies.detail(actor, id);
    return { company: presentCompanyAdmin(company), kpis, allowed_actions: allowedActions };
  }

  /** `featured_to_watch` and `featured_order` need `companies.feature` (Super admin). */
  @Patch(':id')
  @RequirePermission('companies.edit')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async update(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentCompanyAdmin(await this.companies.update(actor, id, body));
  }

  @Post(':id/suspend')
  @HttpCode(200)
  @RequirePermission('accounts.suspend')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async suspend(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentCompanyAdmin(await this.companies.suspend(actor, id, body));
  }

  /** The single Company Account (ADR-030, P3). */
  @Get(':id/team')
  @RequirePermission('companies.view')
  @ApiOkResponse(OK)
  async team(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const team = await this.companies.team(actor, id);
    const verified = await this.verification.verifiedUserIds(team.map((m) => m.userId));
    return Promise.all(
      team.map(async (member) => {
        const user = await this.members.view(member.userId);
        return {
          user: {
            id: user.id,
            full_name: user.fullName,
            avatar_url: null,
            headline: null,
            city: null,
            verified: verified.has(user.id),
            is_student: user.profileStatus === 'STUDENT',
          },
          role: member.role,
        };
      }),
    );
  }

  @Post(':id/verification/remove')
  @HttpCode(200)
  @RequirePermission('verification.decide')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async removeVerification(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentCompanyAdmin(await this.companies.removeVerification(actor, id, body));
  }
}
