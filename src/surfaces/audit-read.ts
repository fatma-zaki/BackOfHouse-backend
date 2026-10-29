import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, from, mergeMap } from 'rxjs';
import { RequestContext } from '../common/context/request-context';
import { isUuid } from '../common/ids/uuid-v7';
import { AuditLogger, auditActorOf } from '../modules/audit';
import { TransactionRunner } from '../platform/database';

export const AUDIT_READ_KEY = 'boh:audit_read';

export interface AuditReadOptions {
  /** Dotted action, e.g. `verification.document.view`, `user.contact.view`, `export.download`. */
  action: string;
  entityType: string;
  /** Route parameter holding the entity id (a UUID). Default `id`. */
  idParam?: string;
}

/**
 * Marks a sensitive read (ADR-016 amendment, execution-plan.md §1.4): document views,
 * contact views, export downloads, signed private-file URLs. An interceptor cannot
 * tell which reads are sensitive, so each such route says so.
 */
export const AuditRead = (options: AuditReadOptions): MethodDecorator => SetMetadata(AUDIT_READ_KEY, options);

/**
 * Writes the audit row for `@AuditRead` routes in its own transaction after the
 * handler succeeds and before the response is sent. If the audit row cannot be
 * written the read fails (fail closed): nothing sensitive leaves unaudited.
 */
@Injectable()
export class AuditReadInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditLogger,
    private readonly transactions: TransactionRunner,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditReadOptions | undefined>(AUDIT_READ_KEY, context.getHandler());
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const entityId = request.params[options.idParam ?? 'id'];
    if (!entityId || !isUuid(entityId)) {
      throw new Error(`@AuditRead(${options.action}) needs a UUID route parameter "${options.idParam ?? 'id'}"`);
    }

    return next.handle().pipe(
      mergeMap((result: unknown) =>
        from(
          this.transactions.run(() =>
            this.audit.record({
              actor: auditActorOf(RequestContext.actor()),
              action: options.action,
              entityType: options.entityType,
              entityId,
            }),
          ),
        ).pipe(mergeMap(async () => result)),
      ),
    );
  }
}
