/** One experience entry, dates as `YYYY-MM-DD`; `end` null while current. */
export interface ExperienceSpan {
  company: string;
  start: string;
  end: string | null;
}

const DAY_MS = 86_400_000;
/** Spans count both end days, so a full calendar year (365 or 366 days) counts as one. */
const YEAR_DAYS = 365;

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);

/**
 * Whole years covered by the entries up to `today` (`Profile.years_experience`).
 * Overlapping or back-to-back roles count once, so two parallel jobs never double a
 * year. A current role (no end) runs to today.
 */
export function yearsOfExperience(entries: readonly ExperienceSpan[], today: string): number {
  const last = dayNumber(today);
  const spans = entries
    .map((e) => [dayNumber(e.start), Math.min(e.end ? dayNumber(e.end) : last, last)] as const)
    .filter(([start, end]) => end >= start)
    .sort((a, b) => a[0] - b[0]);

  let days = 0;
  let current: [number, number] | null = null;
  for (const [start, end] of spans) {
    if (current && start <= current[1] + 1) {
      current[1] = Math.max(current[1], end);
    } else {
      if (current) days += current[1] - current[0] + 1;
      current = [start, end];
    }
  }
  if (current) days += current[1] - current[0] + 1;
  return Math.floor(days / YEAR_DAYS);
}

/** Profile order: current roles first, then by start date, newest first. */
export function compareExperience(a: ExperienceSpan, b: ExperienceSpan): number {
  if ((a.end === null) !== (b.end === null)) return a.end === null ? -1 : 1;
  return b.start.localeCompare(a.start);
}

/** The company of the most recent current role, if any (`Profile.company`). */
export function currentCompany(entries: readonly ExperienceSpan[]): string | null {
  const current = entries.filter((e) => e.end === null).sort(compareExperience);
  return current[0]?.company ?? null;
}
