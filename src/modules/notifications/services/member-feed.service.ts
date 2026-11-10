import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember } from '../../../common/context/actor';
import { NotFoundError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { PrismaService } from '../../../platform/database';
import { MembersService } from '../../identity';
import { catalogEntry, isKnownType, NotificationCategory, NotificationTargetType } from '../domain/catalog';
import { renderTemplate, TemplateVars } from '../domain/template';

/** contracts/app `Notification`. */
export interface MemberNotificationView {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: Date;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  read: boolean;
}

/** Who the app shows as the sender of platform notifications. */
export const NOTIFICATION_SOURCE = 'Back of House';

/**
 * The member's in-app notifications (contracts/app /me/notifications*): newest first, in
 * the request language. Individuals only, like every `/me/*` route.
 */
@Injectable()
export class MemberFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(
    actor: Actor | undefined,
    query: { page: number; page_size: number },
    locale: Locale,
  ): Promise<{ items: MemberNotificationView[]; hasMore: boolean }> {
    const { userId } = requireMember(actor);
    const rows = await this.prisma.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.page_size,
      take: query.page_size + 1,
    });
    const member = await this.members.view(userId);
    const items = rows
      .slice(0, query.page_size)
      .filter((row) => isKnownType(row.type))
      .map((row) => {
        const entry = catalogEntry(row.type);
        const templates = entry.templates[locale];
        const vars: TemplateVars = { ...(row.payload as TemplateVars), full_name: member.fullName };
        return {
          id: row.id,
          category: entry.category,
          title: renderTemplate(templates.title, vars),
          body: renderTemplate(templates.body, vars),
          createdAt: row.createdAt,
          targetType: (row.targetType as NotificationTargetType | null) ?? null,
          targetId: row.targetId,
          read: row.readAt !== null,
        };
      });
    return { items, hasMore: rows.length > query.page_size };
  }

  /** Idempotent. Another member's notification is not found (404). */
  async markRead(actor: Actor | undefined, notificationId: string): Promise<void> {
    const { userId } = requireMember(actor);
    if (!z.string().uuid().safeParse(notificationId).success) throw new NotFoundError('Notification not found');
    const owned = await this.prisma.notification.count({ where: { id: notificationId, recipientUserId: userId } });
    if (owned === 0) throw new NotFoundError('Notification not found');
    await this.prisma.notification.updateMany({
      where: { id: notificationId, readAt: null },
      data: { readAt: this.clock.now() },
    });
  }

  async markAllRead(actor: Actor | undefined): Promise<void> {
    const { userId } = requireMember(actor);
    await this.prisma.notification.updateMany({
      where: { recipientUserId: userId, readAt: null },
      data: { readAt: this.clock.now() },
    });
  }
}
