import { HttpException, HttpStatus } from '@nestjs/common';

/** Stable, machine-readable error codes for API clients. */
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL = 'INTERNAL_ERROR',
}

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  code: ErrorCode;
  message: string;
  timestamp: string;
  path: string;
  details?: Record<string, unknown>[];
}

/**
 * Base class for all errors the API deliberately exposes to clients.
 * Extending HttpException keeps interoperability with Nest internals while the
 * global filter renders a single consistent body.
 */
export class BusinessException extends HttpException {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>[];

  constructor(
    status: number,
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>[],
  ) {
    super(message, status);
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
  }
}

export class BadRequestException extends BusinessException {
  constructor(message: string, details?: Record<string, unknown>[]) {
    super(HttpStatus.BAD_REQUEST, message, ErrorCode.BAD_REQUEST, details);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = 'Authentication required') {
    super(HttpStatus.UNAUTHORIZED, message, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = 'You do not have permission to perform this action') {
    super(HttpStatus.FORBIDDEN, message, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundException extends BusinessException {
  constructor(resource: string, id?: string) {
    const suffix = id ? ` with id ${id}` : '';
    super(HttpStatus.NOT_FOUND, `${resource}${suffix} was not found`, ErrorCode.NOT_FOUND);
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message, ErrorCode.CONFLICT);
  }
}

export class UnprocessableEntityException extends BusinessException {
  constructor(message: string, details?: Record<string, unknown>[]) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, ErrorCode.UNPROCESSABLE, details);
  }
}

/**
 * Raised when an infrastructure call fails. Details are logged server-side;
 * clients only ever see the generic message.
 */
export class InternalOperationException extends BusinessException {
  constructor(message = 'The request could not be completed') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, ErrorCode.INTERNAL);
  }
}
