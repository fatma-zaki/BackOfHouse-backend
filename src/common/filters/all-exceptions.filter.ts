import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { DomainError, ErrorCode, FieldErrors } from '../errors';
import { RequestContext } from '../context/request-context';
import { scrubSecrets } from '../text/scrub-secrets';

/** The single error body (api-map.md §1.3, ADR-008). */
export interface ErrorBody {
  code: string;
  message: string;
  trace_id: string;
  errors?: FieldErrors;
}

interface BodyParserError {
  status?: number;
  statusCode?: number;
  type?: string;
}

const HTTP_STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_FAILED,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Renders every failure as `{ code, message, trace_id, errors }`.
 *
 * Unknown errors (bugs, Prisma, drivers) are logged in full and returned as a
 * bare 500 so that stack traces, SQL and secrets never reach a client
 * (§15.1 "no sensitive details").
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { status, body } = this.toResponse(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // The message and stack are scrubbed: driver errors can embed connection strings.
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        {
          err: { type: error.name, message: scrubSecrets(error.message), stack: scrubSecrets(error.stack ?? '') },
          method: request.method,
          path: request.path,
          trace_id: body.trace_id,
        },
        'Unhandled error',
      );
    }

    response.status(status).json(body);
  }

  toResponse(exception: unknown): { status: number; body: ErrorBody } {
    const trace_id = RequestContext.requestId();

    if (exception instanceof DomainError) {
      return {
        status: exception.status,
        body: {
          code: exception.code,
          message: exception.message,
          trace_id,
          ...(exception.errors ? { errors: exception.errors } : {}),
        },
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: { code: ErrorCode.RATE_LIMITED, message: 'Too many requests', trace_id },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: { code: this.codeFor(status), message: this.messageOf(exception), trace_id },
      };
    }

    // Errors raised by Express body parsing (oversized or malformed JSON).
    const parserError = exception as BodyParserError;
    const parserStatus = parserError?.status ?? parserError?.statusCode;
    if (typeof parserStatus === 'number' && parserStatus >= 400 && parserStatus < 500) {
      const message = parserError.type === 'entity.too.large' ? 'Request body is too large' : 'Malformed request body';
      return { status: parserStatus, body: { code: this.codeFor(parserStatus), message, trace_id } };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: ErrorCode.SERVER_ERROR, message: 'An unexpected error occurred', trace_id },
    };
  }

  private codeFor(status: number): string {
    return HTTP_STATUS_CODES[status] ?? (status >= 500 ? ErrorCode.SERVER_ERROR : ErrorCode.BAD_REQUEST);
  }

  private messageOf(exception: HttpException): string {
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }
    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.map((item) => String(item)).join('; ');
    }
    return typeof message === 'string' ? message : exception.message;
  }
}
