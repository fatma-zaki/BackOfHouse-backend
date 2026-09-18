import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/** Field → messages, e.g. `{ "trade_name_en": ["must be at most 200 characters"] }`. */
export type FieldErrors = Record<string, string[]>;

/**
 * Base class for every error deliberately returned to a client. The global
 * filter renders it as `{ code, message, trace_id, errors }`. Anything that is
 * not a DomainError (or a Nest HttpException) becomes a generic 500.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode | string,
    message: string,
    readonly status: HttpStatus,
    readonly errors?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationFailedError extends DomainError {
  constructor(errors: FieldErrors) {
    // 422 for validation (ADR-008): the frontend maps 422 to form errors.
    super(ErrorCode.VALIDATION_FAILED, 'Validation failed', HttpStatus.UNPROCESSABLE_ENTITY, errors);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Authentication is required') {
    super(ErrorCode.UNAUTHENTICATED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You are not allowed to perform this action', code: string = ErrorCode.FORBIDDEN) {
    super(code, message, HttpStatus.FORBIDDEN);
  }
}

/** Also used for resources of another organization, so existence never leaks. */
export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, code: string = ErrorCode.CONFLICT) {
    super(code, message, HttpStatus.CONFLICT);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
  }
}
