/**
 * Removes credentials from free text (error messages) before it is logged or
 * stored. Structured fields are redacted by pino paths; this covers strings.
 */
const URL_CREDENTIALS = /([a-z][a-z0-9+.-]*:\/\/[^:/?#\s@]+:)[^@\s/]+@/gi;
const BEARER_TOKEN = /(bearer\s+)[a-z0-9._~+/=-]+/gi;
const KEY_VALUE_SECRET = /\b(password|passwd|pwd|secret|token|api[_-]?key)(\s*[=:]\s*)[^\s&,;]+/gi;

export function scrubSecrets(text: string): string {
  return text
    .replace(URL_CREDENTIALS, '$1[REDACTED]@')
    .replace(BEARER_TOKEN, '$1[REDACTED]')
    .replace(KEY_VALUE_SECRET, '$1$2[REDACTED]');
}
