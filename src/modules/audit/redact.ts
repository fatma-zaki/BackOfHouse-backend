/**
 * Redaction for audit `changes` (security-and-audit.md §4.1): never store
 * tokens, secrets or document contents; mask emails and phone numbers.
 * Applied recursively to any JSON-like value before it is written.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Keys whose values are dropped entirely. Matched case-insensitively as substrings. */
const DENY_KEY_FRAGMENTS = [
  'password',
  'secret',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'otp',
  'private_key',
  'document_content',
  'file_content',
];

const EMAIL_KEY = /(^|_)email$/i;
const PHONE_KEY = /(^|_)(phone|mobile)(_number)?$/i;
const MAX_DEPTH = 10;

export const REDACTED = '[REDACTED]';

export function maskEmail(value: string): string {
  const at = value.indexOf('@');
  if (at <= 0) {
    return REDACTED;
  }
  return `${value[0]}***${value.slice(at)}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? `***${digits.slice(-2)}` : REDACTED;
}

function isDenied(key: string): boolean {
  const lower = key.toLowerCase();
  return DENY_KEY_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

export function redact(value: unknown, depth = 0): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (depth > MAX_DEPTH) {
    return REDACTED;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (isDenied(key)) {
        result[key] = REDACTED;
      } else if (typeof entry === 'string' && EMAIL_KEY.test(key)) {
        result[key] = maskEmail(entry);
      } else if (typeof entry === 'string' && PHONE_KEY.test(key)) {
        result[key] = maskPhone(entry);
      } else {
        result[key] = redact(entry, depth + 1);
      }
    }
    return result;
  }
  // Functions, symbols, bigints: never meaningful in an audit record.
  return REDACTED;
}
