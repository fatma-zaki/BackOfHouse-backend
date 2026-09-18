import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationEntity, NotificationType } from './notification.types';
import { AuthContext } from '../auth/types/auth-context';
import { Tables } from '../common/constants';
import { InternalOperationException, NotFoundException } from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';

export interface CreateNotificationCommand {
  profileId: UUID;
  type: NotificationType;
  title: string;
  body?: string;
}

/**
 * Notifications are written by backend flows only; there is no client-facing
 * create endpoint. Every read and write is scoped by `user_id` taken from the
 * verified token, so one member cannot reach another member's inbox.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listOwn(
    context: AuthContext,
    pagination: PaginationParams,
    unreadOnly: boolean,
  ): Promise<ListResult<NotificationEntity>> {
    let request = this.databaseService.admin
      .from(Tables.NOTIFICATIONS)
      .select('*', { count: 'exact' })
      .eq('user_id', context.profileId);

    if (unreadOnly) {
      request = request.eq('read', false);
    }

    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list notifications: ${error.message}`);
      throw new InternalOperationException('Unable to list notifications');
    }

    return { data: (data ?? []) as NotificationEntity[], total: count ?? 0 };
  }

  /**
   * Marks one notification read. The update is filtered by both the id and the
   * caller's profile, so a guessed id simply matches no row.
   */
  async markAsRead(context: AuthContext, notificationId: UUID): Promise<NotificationEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NOTIFICATIONS)
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', context.profileId)
      .select('*')
      .maybeSingle<NotificationEntity>();

    if (error) {
      this.logger.error(`Failed to mark notification read: ${error.message}`);
      throw new InternalOperationException('Unable to update the notification');
    }

    if (!data) {
      throw new NotFoundException('Notification', notificationId);
    }

    return data;
  }

  async markAllAsRead(context: AuthContext): Promise<{ updated: number }> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NOTIFICATIONS)
      .update({ read: true })
      .eq('user_id', context.profileId)
      .eq('read', false)
      .select('id');

    if (error) {
      this.logger.error(`Failed to mark notifications read: ${error.message}`);
      throw new InternalOperationException('Unable to update notifications');
    }

    return { updated: data?.length ?? 0 };
  }

  async remove(context: AuthContext, notificationId: UUID): Promise<void> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NOTIFICATIONS)
      .delete()
      .eq('id', notificationId)
      .eq('user_id', context.profileId)
      .select('id');

    if (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw new InternalOperationException('Unable to delete the notification');
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Notification', notificationId);
    }
  }

  /** Internal entry point for other modules; never exposed as a route. */
  async createForUser(command: CreateNotificationCommand): Promise<void> {
    const { error } = await this.databaseService.admin.from(Tables.NOTIFICATIONS).insert({
      user_id: command.profileId,
      type: command.type,
      title: command.title,
      body: command.body ?? null,
      read: false,
    });

    if (error) {
      // A missing notification must not fail the operation that triggered it.
      this.logger.error(`Failed to create notification: ${error.message}`);
    }
  }
}
