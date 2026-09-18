import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { BusinessException, ErrorCode, ErrorResponseBody } from '../exceptions/business.exceptions';

/**
 * Renders every error as the same JSON envelope.
 *
 * Unknown errors (database drivers, bugs, third-party SDKs) are logged in full
 * server-side and reported to the client as a bare 500, so stack traces, SQL
 * fragments and secrets never leave the process.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception, request.url);
    const summary = `${request.method} ${request.url} -> ${body.statusCode} ${body.code}`;

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const reason = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(`${summary}: ${reason}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.debug(summary);
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown, path: string): ErrorResponseBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof BusinessException) {
      return {
        statusCode: exception.getStatus(),
        error: exception.name,
        code: exception.code,
        message: exception.message,
        timestamp,
        path,
        ...(exception.details ? { details: exception.details } : {}),
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        code: ErrorCode.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded. Please retry later.',
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        error: exception.name,
        code: this.codeForStatus(status),
        message: this.messageFrom(exception),
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      code: ErrorCode.INTERNAL,
      message: 'An unexpected error occurred',
      timestamp,
      path,
    };
  }

  private messageFrom(exception: HttpException): string {
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }
    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.map((entry) => String(entry)).join(', ');
    }
    return typeof message === 'string' ? message : exception.message;
  }

  private codeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.UNPROCESSABLE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR ? ErrorCode.INTERNAL : ErrorCode.BAD_REQUEST;
    }
  }
}
