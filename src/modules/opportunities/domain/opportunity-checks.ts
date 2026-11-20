import { OpportunityContent, TYPE_RULES } from './opportunity-type.policy';

/** contracts/admin `AutoCheck`. */
export interface AutoCheck {
  key: 'COMPANY_VERIFIED' | 'NO_CONTACT_DETAILS' | 'WORKING_HOURS_PRESENT' | 'PAY_PRESENT' | 'NO_FEE_LANGUAGE';
  result: 'PASS' | 'WARN' | 'FAIL';
  message: string;
}

/** The settings the checks read (contracts/admin `PlatformSettings`). */
export interface CheckSettings {
  hideContactDetails: boolean;
  autoFlagFees: boolean;
}

/** Why a listing went to moderation automatically (moderation `REPORT_REASONS`). */
export type FlagReason = 'SCAM' | 'SPAM';

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const toLatinDigits = (text: string) => text.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const URL = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]/i;
/** Eight or more digits, allowing spaces, dots, dashes and a leading +: a phone number. */
const PHONE = /(?:\+|\b)\d(?:[\s.-]?\d){7,}\b/;
const HANDLE = /(?:^|\s)@[a-z0-9_.]{3,}/i;

const FEE = new RegExp(
  [
    String.raw`\b(?:registration|application|training|processing|placement|visa|uniform)\s+fees?\b`,
    String.raw`\bpay\s+(?:a\s+|the\s+)?fee\b`,
    String.raw`\b(?:refundable\s+)?deposit\b`,
    // "رسوم متحركة" is animation, not fees.
    String.raw`رسوم(?!\s+(?:ال)?متحركة)`,
    String.raw`رسم\s+(?:التسجيل|تسجيل|التقديم)`,
    String.raw`مبلغ\s+(?:تأمين|التأمين)`,
    String.raw`ادفع|دفع\s+مبلغ`,
  ].join('|'),
  'i',
);

const HOURS = new RegExp(
  [
    String.raw`\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b`,
    String.raw`\b\d{1,2}:\d{2}\b`,
    String.raw`\b(?:hours?|shifts?|full[- ]time|part[- ]time|schedule|days?\s+a\s+week)\b`,
    'ساعة|ساعات|دوام|وردية|ورديات|مناوبة',
  ].join('|'),
  'i',
);

/** All the text a company wrote on a listing, in one string. */
export function listingText(content: OpportunityContent): string {
  return toLatinDigits(
    [
      content.title,
      content.summary,
      content.description,
      content.compensation ?? '',
      content.duration ?? '',
      ...content.responsibilities,
      ...content.requirements,
      ...content.skills,
    ].join('\n'),
  );
}

/** Contact details written into the text: an email, a phone number, a link or a handle. */
export function hasContactDetails(text: string): boolean {
  return EMAIL.test(text) || URL.test(text) || PHONE.test(text) || HANDLE.test(text);
}

export const hasFeeLanguage = (text: string) => FEE.test(text);
export const mentionsHours = (text: string) => HOURS.test(text);

/**
 * The automated checks run on submit (execution-plan Phase 5, contracts/admin `AutoCheck`):
 * verified company, contact details in the text, working hours, pay and fee language.
 * A FAIL on contact details or fees flags the listing, which opens a moderation case.
 */
export function runChecks(
  content: OpportunityContent,
  company: { verified: boolean },
  settings: CheckSettings,
): { checks: AutoCheck[]; flags: FlagReason[] } {
  const text = listingText(content);
  const rule = TYPE_RULES[content.type];
  const checks: AutoCheck[] = [];
  const flags: FlagReason[] = [];

  checks.push(
    company.verified
      ? { key: 'COMPANY_VERIFIED', result: 'PASS', message: 'The company is verified' }
      : { key: 'COMPANY_VERIFIED', result: 'WARN', message: 'The company is not verified yet' },
  );

  if (!hasContactDetails(text)) {
    checks.push({ key: 'NO_CONTACT_DETAILS', result: 'PASS', message: 'No contact details in the text' });
  } else if (settings.hideContactDetails) {
    checks.push({
      key: 'NO_CONTACT_DETAILS',
      result: 'FAIL',
      message: 'The text contains an email, phone number, link or handle; applicants reach companies in the app',
    });
    flags.push('SPAM');
  } else {
    checks.push({ key: 'NO_CONTACT_DETAILS', result: 'WARN', message: 'The text contains contact details' });
  }

  if (rule.audience === 'COMPANY') {
    checks.push({ key: 'WORKING_HOURS_PRESENT', result: 'PASS', message: 'Not needed for a supplier request' });
  } else if (mentionsHours(text)) {
    checks.push({ key: 'WORKING_HOURS_PRESENT', result: 'PASS', message: 'Working hours are described' });
  } else {
    checks.push({ key: 'WORKING_HOURS_PRESENT', result: 'WARN', message: 'No working hours or schedule found' });
  }

  if (!rule.payExpected) {
    checks.push({ key: 'PAY_PRESENT', result: 'PASS', message: 'Pay is not expected for this type' });
  } else if (content.compensation?.trim()) {
    checks.push({ key: 'PAY_PRESENT', result: 'PASS', message: 'Pay is stated' });
  } else {
    checks.push({ key: 'PAY_PRESENT', result: 'WARN', message: 'Pay is not stated' });
  }

  if (!hasFeeLanguage(text)) {
    checks.push({ key: 'NO_FEE_LANGUAGE', result: 'PASS', message: 'No fees asked of applicants' });
  } else if (settings.autoFlagFees) {
    checks.push({ key: 'NO_FEE_LANGUAGE', result: 'FAIL', message: 'The text asks applicants for a fee or deposit' });
    flags.push('SCAM');
  } else {
    checks.push({ key: 'NO_FEE_LANGUAGE', result: 'WARN', message: 'The text mentions a fee or deposit' });
  }

  return { checks, flags };
}

/**
 * The review deadline state (contracts/admin `sla_state`): OVERDUE after the deadline,
 * DUE_SOON in the last sixth of the window (the last 4 hours of the default 24).
 */
export function slaState(submittedAt: Date | null, dueAt: Date | null, now: Date): 'OK' | 'DUE_SOON' | 'OVERDUE' {
  if (!submittedAt || !dueAt) return 'OK';
  const left = dueAt.getTime() - now.getTime();
  if (left < 0) return 'OVERDUE';
  return left <= (dueAt.getTime() - submittedAt.getTime()) / 6 ? 'DUE_SOON' : 'OK';
}
