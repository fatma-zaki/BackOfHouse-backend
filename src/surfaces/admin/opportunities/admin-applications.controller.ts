import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage, CursorPageMeta, Page } from '../../../common/pagination';
import {
  ADMIN_APPLICATION_STATUS,
  ADMIN_APPLICATION_STATUSES,
  ApplicationAdminView,
  ApplicationsAdminService,
  OPPORTUNITY_TYPES,
} from '../../../modules/opportunities';
import { RequirePermission } from '../require-permission.decorator';
import { presentAdminCompanySummary } from './admin-opportunities.controller';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** contracts/admin GET /applications query (validated again in the service). */
export class ApplicationsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  to?: string;

  @ApiPropertyOptional({ enum: ADMIN_APPLICATION_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_APPLICATION_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: OPPORTUNITY_TYPES })
  @IsOptional()
  @IsIn(OPPORTUNITY_TYPES)
  type?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/** contracts/admin GET /users/{id}/applications query. */
export class UserApplicationsQueryDto {
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

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {}, meta: {} } } };

/**
 * contracts/admin `ApplicationAdmin`. The applicant is the snapshot taken when they applied
 * (contact details never appear). `status` uses the admin names; `stage` is the app status
 * (CONTACT reads as SHORTLISTED in `status`).
 */
export function presentApplicationAdmin(v: ApplicationAdminView) {
  return {
    id: v.id,
    reference: v.reference,
    applicant: {
      id: v.applicantUserId,
      full_name: v.applicant.name,
      avatar_url: null,
      headline: v.applicant.headline || null,
      city: v.applicant.city || null,
      verified: v.applicant.verified,
      is_student: v.applicant.profileStatus === 'STUDENT',
    },
    opportunity: {
      id: v.opportunityId,
      title: v.listing.title,
      type: v.listing.type,
      company: presentAdminCompanySummary(v.company),
    },
    status: ADMIN_APPLICATION_STATUS[v.status],
    stage: v.status,
    time_in_stage_days: v.timeInStageDays,
    created_at: v.createdAt.toISOString(),
    updated_at: v.updatedAt.toISOString(),
  };
}

/** All applications, read-only (contracts/admin GET /applications). */
@ApiTags('Admin applications')
@ApiCookieAuth('adminSession')
@Controller('applications')
export class AdminApplicationsController {
  constructor(private readonly applications: ApplicationsAdminService) {}

  @Get()
  @RequirePermission('applications.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: ApplicationsQueryDto) {
    const { items, total } = await this.applications.list(actor, query);
    return adminPage(items.map(presentApplicationAdmin), query, total);
  }
}

/** A user's applications (contracts/admin GET /users/{id}/applications). */
@ApiTags('Admin users')
@ApiCookieAuth('adminSession')
@Controller('users')
export class AdminUserApplicationsController {
  constructor(private readonly applications: ApplicationsAdminService) {}

  @Get(':id/applications')
  @RequirePermission('users.view')
  @ApiOkResponse(OK)
  async list(
    @CurrentActor() actor: Actor | undefined,
    @Param('id') id: string,
    @Query() query: UserApplicationsQueryDto,
  ) {
    const { items, nextCursor } = await this.applications.ofUser(actor, id, query);
    return new Page<ReturnType<typeof presentApplicationAdmin>, CursorPageMeta>(items.map(presentApplicationAdmin), {
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
    });
  }
}
