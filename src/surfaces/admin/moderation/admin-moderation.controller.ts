import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage } from '../../../common/pagination';
import { ModerationCaseView, ModerationService } from '../../../modules/moderation';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /moderation/cases query (validated again in the service). */
export class ModerationQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'AUTO_FLAGGED', 'RESOLVED'] })
  @IsOptional()
  @IsIn(['OPEN', 'AUTO_FLAGGED', 'RESOLVED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  target_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

/** contracts/admin `ModerationCase`. Case notes are internal notes on the owner (/{subject}/{id}/notes). */
function presentCase(c: ModerationCaseView) {
  return {
    id: c.id,
    target_type: c.targetType,
    target: c.target,
    reports_count: c.reportsCount,
    reasons: c.reasons,
    notes: [] as unknown[],
    source: c.source,
    status: c.status,
    resolution: c.resolution,
    account_history: c.accountHistory,
    created_at: c.createdAt.toISOString(),
  };
}

/** The moderation queue (contracts/admin /moderation/cases*). */
@ApiTags('Admin moderation')
@ApiCookieAuth('adminSession')
@Controller('moderation/cases')
export class AdminModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get()
  @RequirePermission('moderation.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: ModerationQueryDto) {
    const { items, total } = await this.moderation.list(actor, query);
    return adminPage(items.map(presentCase), query, total);
  }

  @Get(':id')
  @RequirePermission('moderation.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentCase(await this.moderation.detail(actor, id));
  }

  /** `SUSPEND_ACCOUNT` also needs `accounts.suspend`. */
  @Post(':id/actions')
  @HttpCode(200)
  @RequirePermission('moderation.act')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async act(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentCase(await this.moderation.act(actor, id, body));
  }
}
