import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { CursorPageMeta, Page } from '../../../common/pagination';
import { StaffBellService, StaffNotificationView } from '../../../modules/notifications';

/** contracts/admin GET /notifications query. */
export class AdminNotificationsQueryDto {
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

function presentStaffNotification(n: StaffNotificationView) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    read_at: n.readAt?.toISOString() ?? null,
    created_at: n.createdAt.toISOString(),
  };
}

/** The admin bell (contracts/admin GET /notifications): the signed-in staff member's own items. */
@ApiTags('Admin dashboards')
@ApiCookieAuth('adminSession')
@Controller('notifications')
export class AdminNotificationsController {
  constructor(private readonly bell: StaffBellService) {}

  @Get()
  @ApiOkResponse({ description: 'OK', schema: { type: 'object', properties: { data: {}, meta: {} } } })
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: AdminNotificationsQueryDto) {
    const { items, nextCursor } = await this.bell.list(actor, query, RequestContext.locale());
    return new Page<ReturnType<typeof presentStaffNotification>, CursorPageMeta>(items.map(presentStaffNotification), {
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
    });
  }
}
