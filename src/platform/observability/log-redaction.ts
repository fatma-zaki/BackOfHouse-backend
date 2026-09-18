/**
 * Paths removed from every log line (security-and-audit.md §8, PRD §28
 * "no sensitive data in logs"). pino replaces the values with "[REDACTED]".
 */
export const LOG_REDACT_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["x-supabase-auth"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.access_token',
  '*.refresh_token',
  '*.secret',
  '*.api_key',
  '*.otp',
  '*.email',
  '*.phone',
  '*.national_id',
];
