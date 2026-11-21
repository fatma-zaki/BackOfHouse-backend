/**
 * Points rules that need no database (BQ-76, BQ-77, docs/app/README.md "Points, rewards,
 * verification"). Points never grant verification; levels are Rewards levels only.
 */

export const POINT_ENTRY_TYPES = [
  'EVENT_ATTENDANCE',
  'VOLUNTEER_SHIFT',
  'PROFILE_COMPLETED',
  'REFERRAL',
  'WORKSHOP_ATTENDANCE',
  'REWARD_REDEMPTION',
  'MANUAL_ADJUSTMENT',
  'REVERSAL',
] as const;

export type PointEntryType = (typeof POINT_ENTRY_TYPES)[number];

/** Level thresholds on lifetime earned points: L1 0 · L2 100 · L3 500 · L4 1,500. */
export const LEVEL_THRESHOLDS = [0, 100, 500, 1500] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/** The level for lifetime earned points. Spending never lowers it (only earned points count). */
export function levelFor(totalEarned: number): number {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, i) => {
    if (totalEarned >= threshold) level = i + 1;
  });
  return level;
}

/**
 * contracts/app `PointsSummary.level_target`: the earned points the next level starts at,
 * or the balance at the top level.
 */
export function levelTarget(totalEarned: number, balance: number): number {
  const level = levelFor(totalEarned);
  return level >= MAX_LEVEL ? balance : LEVEL_THRESHOLDS[level];
}

/** contracts/app `PointsActivity`: what the app shows for each entry type. */
export type PointsActivity =
  | 'ATTENDED_WORKSHOP'
  | 'ATTENDANCE_VERIFIED'
  | 'VOLUNTEER_SHIFT_COMPLETED'
  | 'PROFILE_COMPLETION'
  | 'REDEEMED_REWARD'
  | 'ADJUSTMENT';

export const ACTIVITY_OF: Record<PointEntryType, PointsActivity> = {
  EVENT_ATTENDANCE: 'ATTENDANCE_VERIFIED',
  WORKSHOP_ATTENDANCE: 'ATTENDED_WORKSHOP',
  VOLUNTEER_SHIFT: 'VOLUNTEER_SHIFT_COMPLETED',
  PROFILE_COMPLETED: 'PROFILE_COMPLETION',
  REWARD_REDEMPTION: 'REDEEMED_REWARD',
  // Corrections from Back of House, reversals and referrals (decided 2026-11-21: ADJUSTMENT).
  MANUAL_ADJUSTMENT: 'ADJUSTMENT',
  REVERSAL: 'ADJUSTMENT',
  REFERRAL: 'ADJUSTMENT',
};

/**
 * How an entry moves the projection. Spending (redemptions and their reversals) moves
 * `totalSpent`; everything else moves `totalEarned`. Balance = earned − spent = ledger sum.
 */
export function balanceDelta(
  type: PointEntryType,
  amount: number,
  reversedType: PointEntryType | null,
): { earned: number; spent: number } {
  const spending = type === 'REWARD_REDEMPTION' || (type === 'REVERSAL' && reversedType === 'REWARD_REDEMPTION');
  return spending ? { earned: 0, spent: -amount } : { earned: amount, spent: 0 };
}

/** Support may add at most this many points per member per calendar month (Riyadh). */
export const SUPPORT_MONTHLY_CAP = 500;

/**
 * contracts/admin POST /points/adjustments: Support adds points only, up to 500 per member
 * per month; Super admins may also take points away. Returns the refusal or null.
 */
export function adjustmentRefusal(
  role: string,
  amount: number,
  supportGrantedThisMonth: number,
): 'NEGATIVE_NOT_ALLOWED' | 'MONTHLY_CAP_REACHED' | null {
  if (role !== 'SUPPORT') return null;
  if (amount < 0) return 'NEGATIVE_NOT_ALLOWED';
  if (supportGrantedThisMonth + amount > SUPPORT_MONTHLY_CAP) return 'MONTHLY_CAP_REACHED';
  return null;
}

/** Profile completed (decided 2026-11-21): headline, city, about, an experience item, a skill and a project. */
export function isProfileComplete(p: {
  headline: string;
  city: string;
  about: string;
  experience: number;
  skills: number;
  projects: number;
}): boolean {
  return (
    p.headline.trim() !== '' &&
    p.city.trim() !== '' &&
    p.about.trim() !== '' &&
    p.experience > 0 &&
    p.skills > 0 &&
    p.projects > 0
  );
}
