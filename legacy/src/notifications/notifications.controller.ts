import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Auth(Permission.NOTIFICATION_READ_OWN)
  @ApiOperation({ summary: 'List your notifications' })
  async listOwn(@CurrentUser() user: AuthContext, @Query() query: ListNotificationsQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.notificationsService.listOwn(
      user,
      pagination,
      query.unread === 'true',
    );
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Patch('read-all')
  @Auth(Permission.NOTIFICATION_READ_OWN)
  @ApiOperation({ summary: 'Mark all your notifications as read' })
  markAllAsRead(@CurrentUser() user: AuthContext) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  @Auth(Permission.NOTIFICATION_READ_OWN)
  @ApiOperation({ summary: 'Mark one of your notifications as read' })
  markAsRead(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.notificationsService.markAsRead(user, id);
  }

  @Delete(':id')
  @Auth(Permission.NOTIFICATION_READ_OWN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of your notifications' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.notificationsService.remove(user, id);
  }
}
