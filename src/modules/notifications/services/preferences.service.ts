import { Injectable } from '@nestjs/common';
import { ValidationFailedError } from '../../../common/errors';
import { PrismaService } from '../../../platform/database';
import { catalogEntry, isKnownType, NOTIFICATION_CATALOG, NotificationChannel } from '../domain/catalog';

export interface PreferenceView {
  type: string;
  channel: NotificationChannel;
  enabled: boolean;
  mandatory: boolean;
}

/**
 * A member's notification choices per type and channel. The route (`PATCH
 * /me/preferences`) waits for the Flutter contract (README §8 question 3).
 */
@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every catalog type and channel, with the member's choice or the default (on). */
  async list(userId: string): Promise<PreferenceView[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { userId } });
    const choice = (type: string, channel: NotificationChannel) =>
      rows.find((row) => row.notificationType === type && row.channel === channel)?.enabled ?? true;
    return NOTIFICATION_CATALOG.flatMap((entry) =>
      entry.channels.map((channel) => ({
        type: entry.type,
        channel,
        enabled: entry.mandatory || choice(entry.type, channel),
        mandatory: entry.mandatory,
      })),
    );
  }

  /** Mandatory (security) types cannot be turned off. */
  async set(userId: string, type: string, channel: NotificationChannel, enabled: boolean): Promise<void> {
    if (!isKnownType(type)) throw new ValidationFailedError({ type: ['is not a notification type'] });
    const entry = catalogEntry(type);
    if (!entry.channels.includes(channel)) {
      throw new ValidationFailedError({ channel: ['is not used by this notification type'] });
    }
    if (entry.mandatory && !enabled) {
      throw new ValidationFailedError({ enabled: ['security notifications cannot be turned off'] });
    }
    await this.prisma.notificationPreference.upsert({
      where: { userId_notificationType_channel: { userId, notificationType: type, channel } },
      create: { userId, notificationType: type, channel, enabled },
      update: { enabled },
    });
  }
}
