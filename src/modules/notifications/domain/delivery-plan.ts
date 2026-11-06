import { DailyWindow, outsideQuietHours } from '../../../common/time/quiet-hours';
import type { CatalogEntry, NotificationChannel } from './catalog';

export interface PlannedDelivery {
  channel: NotificationChannel;
  status: 'QUEUED' | 'SKIPPED';
  nextAttemptAt: Date;
  lastError: string | null;
}

export interface PlanContext {
  /** Channels the member turned off for this type. */
  disabled: ReadonlySet<NotificationChannel>;
  now: Date;
  quietHours: DailyWindow;
}

/**
 * One delivery per catalog channel. A channel the member turned off is recorded as
 * SKIPPED, unless the type is mandatory. Push inside quiet hours is queued for the end
 * of the window; email is never held.
 */
export function planDeliveries(entry: CatalogEntry, context: PlanContext): PlannedDelivery[] {
  return entry.channels.map((channel) => {
    if (!entry.mandatory && context.disabled.has(channel)) {
      return { channel, status: 'SKIPPED', nextAttemptAt: context.now, lastError: 'turned off by the member' };
    }
    const nextAttemptAt =
      channel === 'PUSH' && entry.respectsQuietHours ? outsideQuietHours(context.now, context.quietHours) : context.now;
    return { channel, status: 'QUEUED', nextAttemptAt, lastError: null };
  });
}

const BASE_RETRY_SECONDS = 30;
const MAX_RETRY_SECONDS = 3600;

/** After this many tries a delivery is FAILED. */
export const MAX_DELIVERY_ATTEMPTS = 5;

/** Wait before the next try: 30 s, 1 min, 2 min … at most an hour. */
export function retryDelaySeconds(attempts: number): number {
  return Math.min(BASE_RETRY_SECONDS * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_SECONDS);
}
