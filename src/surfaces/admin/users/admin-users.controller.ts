import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, Page, OffsetPageMeta } from '../../../common/pagination';
import { UserAdminDetailView, UserAdminRowView, UsersAdminService } from '../../../modules/backoffice';
import { AccountStatusService, MemberAuthService } from '../../../modules/identity';
import { VerificationReviewService } from '../../../modules/verification';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /users query. */
export class UsersQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL', 'STUDENT', 'COMPANY'] })
  @IsOptional()
  @IsIn(['INDIVIDUAL', 'STUDENT', 'COMPANY'])
  type?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'joined_from must be a date like 2026-11-01' })
  joined_from?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

function presentRow(r: UserAdminRowView) {
  return {
    id: r.id,
    full_name: r.fullName,
    email_masked: r.emailMasked,
    type: r.type,
    city: r.city,
    // Points arrive with Phase 6.
    points: null,
    verification: r.verification,
    status: r.status,
    joined_at: r.joinedAt.toISOString(),
    last_active_at: r.lastActiveAt?.toISOString() ?? null,
  };
}

/** contracts/admin `UserAdminDetail`. Activity stats fill in with Phases 5 to 7. */
function presentDetail(d: UserAdminDetailView) {
  return {
    user: presentRow(d.user),
    email: d.email,
    phone: d.phone,
    university: null,
    verified_at: d.verifiedAt?.toISOString() ?? null,
    verified_by: d.verifiedBy,
    stats: { points: 0, applications: 0, events_attended: 0, reports_against: 0 },
    allowed_actions: d.allowedActions,
  };
}

/** Members and Company Accounts in the back office (contracts/admin /users*). */
@ApiTags('Admin users')
@ApiCookieAuth('adminSession')
@Controller('users')
export class AdminUsersController {
  constructor(
    private readonly users: UsersAdminService,
    private readonly accounts: AccountStatusService,
    private readonly auth: MemberAuthService,
    private readonly verification: VerificationReviewService,
  ) {}

  @Get()
  @RequirePermission('users.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: UsersQueryDto) {
    const { items, total, counts } = await this.users.list(actor, query);
    return new Page<ReturnType<typeof presentRow>, OffsetPageMeta>(
      items.map(presentRow),
      {
        page: query.page,
        page_size: query.page_size,
        total,
        total_pages: Math.max(1, Math.ceil(total / query.page_size)),
      },
      { counts },
    );
  }

  /** Email and phone only for roles with `users.contact.view`; such views are audited. */
  @Get(':id')
  @RequirePermission('users.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentDetail(await this.users.detail(actor, id));
  }

  @Post('bulk')
  @HttpCode(202)
  @RequirePermission('users.bulk')
  @ApiBody(OBJECT_BODY)
  @ApiAcceptedResponse(OK)
  async bulk(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    const job = await this.users.bulk(actor, body);
    return { job_id: job.jobId, status: job.status };
  }

  @Post(':id/password-reset')
  @HttpCode(204)
  @RequirePermission('users.support_actions')
  @ApiNoContentResponse({ description: 'No content' })
  async passwordReset(@CurrentActor() actor: Actor | undefined, @Param('id') id: string): Promise<void> {
    await this.auth.sendResetLinkFor(actor, id);
  }

  @Post(':id/suspend')
  @HttpCode(200)
  @RequirePermission('accounts.suspend')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async suspend(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    await this.accounts.suspend(actor, id, body);
    return presentDetail(await this.users.detail(actor, id));
  }

  @Post(':id/unsuspend')
  @HttpCode(200)
  @RequirePermission('accounts.suspend')
  @ApiOkResponse(OK)
  async unsuspend(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    await this.accounts.unsuspend(actor, id);
    return presentDetail(await this.users.detail(actor, id));
  }

  @Post(':id/verification/remove')
  @HttpCode(200)
  @RequirePermission('verification.decide')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async removeVerification(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    await this.verification.removeForUser(actor, id, body);
    return presentDetail(await this.users.detail(actor, id));
  }
}
