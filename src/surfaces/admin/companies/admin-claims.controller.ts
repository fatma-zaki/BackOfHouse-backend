import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage } from '../../../common/pagination';
import { ClaimsService, ClaimView } from '../../../modules/companies';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /claims query. */
export class ClaimsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['OPEN', 'APPROVED', 'REJECTED'])
  status?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const CATEGORY: Record<string, string | undefined> = {
  EVENT_ORGANIZER: 'ORGANIZER',
  VENUE: 'VENUE',
  SUPPLIER: 'SUPPLIER',
  AGENCY: 'AGENCY',
  PRODUCTION: 'PRODUCTION',
};

/** contracts/admin `PageClaim`. */
function presentClaim(c: ClaimView) {
  const category = CATEGORY[c.company.companyType];
  return {
    id: c.id,
    company: {
      id: c.company.id,
      slug: c.company.slug,
      name: c.company.name,
      logo_url: null,
      ...(category ? { category } : {}),
      city: c.company.city,
      verified: c.company.verified,
    },
    claimant: {
      id: c.claimant.id,
      full_name: c.claimant.fullName,
      avatar_url: null,
      verified: false,
      is_student: c.claimant.isStudent,
    },
    email: c.email,
    evidence: c.evidence,
    status: c.status,
    created_at: c.createdAt.toISOString(),
  };
}

/** Company page claims (contracts/admin /claims*). Approval never verifies the company. */
@ApiTags('Admin companies')
@ApiCookieAuth('adminSession')
@Controller('claims')
export class AdminClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Get()
  @RequirePermission('claims.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: ClaimsQueryDto) {
    const { items, total } = await this.claims.list(actor, query);
    return adminPage(items.map(presentClaim), query, total);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('claims.decide')
  @ApiOkResponse(OK)
  async approve(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentClaim(await this.claims.approve(actor, id));
  }

  @Post(':id/reject')
  @HttpCode(200)
  @RequirePermission('claims.decide')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async reject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentClaim(await this.claims.reject(actor, id, body));
  }
}
