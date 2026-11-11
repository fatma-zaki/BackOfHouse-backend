import { RIYADH_OFFSET_MS } from './riyadh';

const DAY_MS = 86_400_000;
/** Saudi weekend: Friday (5) and Saturday (6). */
const WEEKEND = new Set([5, 6]);

/**
 * `at` plus `days` Saudi working days (Sunday to Thursday, Riyadh time), at the same time
 * of day. Time inside a weekend starts counting from Sunday 00:00. Public holidays are not
 * counted yet (no holiday calendar; review SLAs show them as working days).
 */
export function addWorkingDays(at: Date, days: number): Date {
  let local = at.getTime() + RIYADH_OFFSET_MS;
  const weekday = () => new Date(local).getUTCDay();
  if (WEEKEND.has(weekday())) {
    while (WEEKEND.has(weekday())) local = Math.floor(local / DAY_MS) * DAY_MS + DAY_MS;
  }
  let remaining = days;
  while (remaining > 0) {
    local += DAY_MS;
    if (!WEEKEND.has(weekday())) remaining -= 1;
  }
  return new Date(local - RIYADH_OFFSET_MS);
}
