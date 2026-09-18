/**
 * Stable machine-readable error codes (api-map.md §1.3). Clients localise on
 * `code`; `message` is English for logs and developers only.
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
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
