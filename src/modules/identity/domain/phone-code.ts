/**
 * Phone sign-in code rules (BQ-78, contracts/app /auth/phone/*). Fixed values for
 * now; they move to platform settings when staff need to change them.
 */
export const PHONE_CODE = {
  /** Digits in a code. */
  length: 6,
  /** A code expires this long after it is sent. */
  ttlSeconds: 5 * 60,
  /** Wrong tries allowed on one code; the try that reaches the cap burns it. */
  maxAttempts: 5,
  /** Codes sent to one phone number in a rolling hour. */
  maxPerPhonePerHour: 5,
  /** Codes requested from one IP address in a rolling hour. */
  maxPerIpPerHour: 20,
  /** Minimum gap between two codes to the same number. */
  resendAfterSeconds: 60,
} as const;

/** E.164: "+" then 8 to 15 digits, no leading zero (ITU-T E.164). */
const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Normalises a phone number to E.164, or returns null when it is not one.
 * Spaces, dashes, dots and brackets are removed; "00" is read as "+"; Arabic-Indic
 * and Eastern Arabic digits are converted. No country is assumed for local formats.
 */
export function normalizePhone(input: string): string | null {
  const digits = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().]/g, '');
  const withPlus = digits.startsWith('00') ? `+${digits.slice(2)}` : digits;
  return E164.test(withPlus) ? withPlus : null;
}

/** "Asia/Riyadh" is UTC+3 all year (no daylight saving), so the Riyadh day is UTC + 3 h. */
export function riyadhDay(at: Date): string {
  return new Date(at.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}
