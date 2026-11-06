/** A daily window in Saudi time, `HH:MM` 24 h (settings `push_quiet_hours`). */
export interface DailyWindow {
  start: string;
  end: string;
}

/** Asia/Riyadh is UTC+3 all year (no daylight saving). */
const RIYADH_OFFSET_MS = 3 * 3600_000;
const DAY_MS = 24 * 3600_000;

function minutesOf(hhmm: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) throw new Error(`Invalid time "${hhmm}"; expected HH:MM`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * The instant the quiet window ends when `at` falls inside it, otherwise null. The
 * window may cross midnight (23:00–08:00) and includes its start but not its end.
 * Equal start and end means no quiet hours. Shared by every push sender (notifications,
 * broadcasts): a push due inside the window waits until it ends.
 */
export function quietHoursEnd(at: Date, window: DailyWindow): Date | null {
  const start = minutesOf(window.start) * 60_000;
  const end = minutesOf(window.end) * 60_000;
  if (start === end) return null;

  const local = at.getTime() + RIYADH_OFFSET_MS;
  const midnight = Math.floor(local / DAY_MS) * DAY_MS;
  const sinceMidnight = local - midnight;

  let endLocal: number | null = null;
  if (start < end) {
    if (sinceMidnight >= start && sinceMidnight < end) endLocal = midnight + end;
  } else if (sinceMidnight >= start) {
    endLocal = midnight + DAY_MS + end;
  } else if (sinceMidnight < end) {
    endLocal = midnight + end;
  }
  return endLocal === null ? null : new Date(endLocal - RIYADH_OFFSET_MS);
}

/** `at`, or the end of the quiet window when `at` falls inside it. */
export function outsideQuietHours(at: Date, window: DailyWindow): Date {
  return quietHoursEnd(at, window) ?? at;
}
