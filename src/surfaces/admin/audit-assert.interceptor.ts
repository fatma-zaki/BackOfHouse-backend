import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import { RequestContext } from '../../common/context/request-context';
import { AppConfig } from '../../config/app.config';
import { surfaceOf } from '../surface-auth.guard';

export const SKIP_AUDIT_ASSERT_KEY = 'boh:skip_audit_assert';

/** For an admin write that is audited elsewhere or deliberately not at all; say why next to it. */
export const SkipAuditAssert = (): MethodDecorator => SetMetadata(SKIP_AUDIT_ASSERT_KEY, true);

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Every admin write is audited (hand-off doc 04 "Audit", ADR-016). Services write
 * the audit row inside their own transaction; this interceptor only checks that a
 * successful admin POST/PUT/PATCH/DELETE wrote at least one. A missing row fails
 * the request in local and test (so tests catch it) and is logged as an error in
 * staging and production (the change already committed).
 */
@Injectable()
export class AuditAssertInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditAssertInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_AUDIT_ASSERT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip || !WRITE_METHODS.has(request.method) || surfaceOf(request.path) !== 'admin') {
      return next.handle();
    }

    return next.handle().pipe(
      map((result: unknown) => {
        if (RequestContext.auditWrites() === 0) {
          const message = `Admin write ${request.method} ${request.path} wrote no audit row (ADR-016)`;
          if (this.config.app.appEnv === 'local' || this.config.app.appEnv === 'test') {
            throw new Error(message);
          }
          this.logger.error(message);
        }
        return result;
      }),
    );
  }
}
