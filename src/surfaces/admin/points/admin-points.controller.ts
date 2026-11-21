import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage, CursorPageMeta, Page } from '../../../common/pagination';
import {
  EarningRulesService,
  EarningRuleView,
  POINT_ENTRY_TYPES,
  PointEntryView,
  PointsService,
} from '../../../modules/engagement';
import { Idempotent } from '../../../platform/idempotency';
import { RequirePermission } from '../require-permission.decorator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** contracts/admin GET /points/ledger query (validated again in the service). */
export class LedgerQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  to?: string;

  @ApiPropertyOptional({ enum: POINT_ENTRY_TYPES })
  @IsOptional()
  @IsIn(POINT_ENTRY_TYPES)
  type?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

/** contracts/admin GET /users/{id}/points query. */
export class UserPointsQueryDto {
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

/** contracts/admin `PointsTransaction`. */
export function presentPointsTransactionAdmin(e: PointEntryView) {
  return {
    id: e.id,
    amount: e.amount,
    type: e.type,
    title: e.title,
    subtitle: e.subtitle,
    source: e.source,
    reason: e.reason,
    created_by: e.createdBy,
    created_at: e.createdAt.toISOString(),
  };
}

/** contracts/admin `EarningRule`. */
function presentEarningRule(r: EarningRuleView) {
  return { key: r.key, points: r.points, enabled: r.enabled, limit_note: r.limitNote, locked: r.locked };
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {}, meta: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** The points ledger and manual adjustments (contracts/admin /points/*). */
@ApiTags('Admin points')
@ApiCookieAuth('adminSession')
@Controller('points')
export class AdminPointsController {
  constructor(private readonly points: PointsService) {}

  @Get('ledger')
  @RequirePermission('points.view')
  @ApiOkResponse(OK)
  async ledger(@CurrentActor() actor: Actor | undefined, @Query() query: LedgerQueryDto) {
    const { items, total } = await this.points.ledger(actor, query);
    return adminPage(items.map(presentPointsTransactionAdmin), query, total);
  }

  @Post('adjustments')
  @RequirePermission('points.adjust')
  @Idempotent({ required: false })
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async adjust(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentPointsTransactionAdmin(await this.points.adjust(actor, body));
  }
}

/** Earning rules (contracts/admin /earning-rules*). */
@ApiTags('Admin rewards')
@ApiCookieAuth('adminSession')
@Controller('earning-rules')
export class AdminEarningRulesController {
  constructor(private readonly rules: EarningRulesService) {}

  @Get()
  @RequirePermission('rewards.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined) {
    return (await this.rules.list(actor)).map(presentEarningRule);
  }

  @Put(':key')
  @RequirePermission('settings.manage')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async update(@CurrentActor() actor: Actor | undefined, @Param('key') key: string, @Body() body: unknown) {
    return presentEarningRule(await this.rules.update(actor, key, body));
  }
}

/** A user's points history (contracts/admin GET /users/{id}/points). */
@ApiTags('Admin users')
@ApiCookieAuth('adminSession')
@Controller('users')
export class AdminUserPointsController {
  constructor(private readonly points: PointsService) {}

  @Get(':id/points')
  @RequirePermission('users.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Query() query: UserPointsQueryDto) {
    const { items, nextCursor } = await this.points.ofUser(actor, id, query);
    return new Page<ReturnType<typeof presentPointsTransactionAdmin>, CursorPageMeta>(
      items.map(presentPointsTransactionAdmin),
      { next_cursor: nextCursor, has_more: nextCursor !== null },
    );
  }
}
