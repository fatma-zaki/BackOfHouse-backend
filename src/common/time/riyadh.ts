/** Asia/Riyadh is UTC+3 all year (no daylight saving). */
export const RIYADH_OFFSET_MS = 3 * 3600_000;

/** The calendar day in Riyadh, `YYYY-MM-DD` (activity, profile views, dashboards). */
export function riyadhDay(at: Date): string {
  return new Date(at.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
}

/** The Riyadh day `days` before `day` (`YYYY-MM-DD`). */
export function daysBefore(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}
