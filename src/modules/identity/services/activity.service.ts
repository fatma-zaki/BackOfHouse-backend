import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { PrismaService } from '../../../platform/database';
import { riyadhDay } from '../domain/phone-code';

const LAST_ACTIVE_EVERY_MS = 3600_000;
/** Bounds the in-process caches; they reset when full (one extra write per user at worst). */
const MAX_CACHED_USERS = 50_000;

/**
 * Activity tracking (execution plan Phase 2): one `user_activity_days` row per member
 * per Riyadh day, and `users.last_active_at` at most hourly. In-process caches make it
 * about one write per user per day; a write that fails is logged and never fails the
 * request.
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private readonly daysSeen = new Set<string>();
  private readonly lastActiveWritten = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async touch(userId: string): Promise<void> {
    const now = this.clock.now();
    const day = riyadhDay(now);
    const dayKey = `${userId}:${day}`;
    const lastWrite = this.lastActiveWritten.get(userId);
    const writeDay = !this.daysSeen.has(dayKey);
    const writeLastActive = lastWrite === undefined || now.getTime() - lastWrite >= LAST_ACTIVE_EVERY_MS;
    if (!writeDay && !writeLastActive) return;

    if (this.daysSeen.size >= MAX_CACHED_USERS) this.daysSeen.clear();
    if (this.lastActiveWritten.size >= MAX_CACHED_USERS) this.lastActiveWritten.clear();
    this.daysSeen.add(dayKey);
    this.lastActiveWritten.set(userId, writeLastActive ? now.getTime() : (lastWrite ?? now.getTime()));

    try {
      if (writeDay) {
        await this.prisma.$executeRaw`
          INSERT INTO app.user_activity_days (user_id, day) VALUES (${userId}::uuid, ${day}::date)
          ON CONFLICT DO NOTHING`;
      }
      if (writeLastActive) {
        await this.prisma.user.updateMany({ where: { id: userId }, data: { lastActiveAt: now } });
      }
    } catch (error) {
      this.daysSeen.delete(dayKey);
      this.lastActiveWritten.delete(userId);
      this.logger.warn(`Could not record activity: ${(error as Error).message}`);
    }
  }
}
