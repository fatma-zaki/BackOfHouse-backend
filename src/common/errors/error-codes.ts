/**
 * Stable machine-readable error codes (api-map.md §1.3). Clients localise on
 * `code`; `message` is English for logs and developers only. Every value is
 * listed in docs/error-codes.md (checked by error-codes.catalog.spec.ts); where
 * the two client contracts disagreed, the Flutter code won (D3).
 *
 * Only codes the current stages can raise are listed. Domain-specific codes
 * named in api-map.md (WRONG_ACCOUNT_CONTEXT, MFA_REQUIRED, DUPLICATE_ORGANIZATION,
 * ...) are added by the module that first raises them.
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVER_ERROR = 'SERVER_ERROR',
  // Idempotency-Key (platform/idempotency)
  IDEMPOTENCY_KEY_REQUIRED = 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED',
  IDEMPOTENCY_KEY_IN_USE = 'IDEMPOTENCY_KEY_IN_USE',
  // Staff identity (ADR-032)
  NOT_STAFF = 'NOT_STAFF',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  EMAIL_DOMAIN_NOT_ALLOWED = 'EMAIL_DOMAIN_NOT_ALLOWED',
  STAFF_ALREADY_EXISTS = 'STAFF_ALREADY_EXISTS',
  LAST_SUPER_ADMIN = 'LAST_SUPER_ADMIN',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
}
