import { createHash } from 'node:crypto';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, catchError, from, mergeMap, of, throwError } from 'rxjs';
import type { Actor } from '../../common/context/actor';
import { RequestContext } from '../../common/context/request-context';
import { DomainError, ErrorCode } from '../../common/errors';
import { Page } from '../../common/pagination/page';
import type { Prisma } from '../../generated/prisma/client';
import { IDEMPOTENT_KEY, IdempotentOptions } from './idempotent.decorator';
import { IdempotencyStore } from './idempotency.store';

export const IDEMPOTENCY_HEADER = 'idempotency-key';
const KEY_FORMAT = /^[A-Za-z0-9._:-]{1,255}$/;

/** Keys are per caller: two users may send the same key without colliding. */
export function idempotencyScope(actor: Actor | undefined): string {
  switch (actor?.kind) {
    case 'staff':
      return `staff:${actor.staffId}`;
    case 'member':
    case 'company':
      return `user:${actor.userId}`;
    case 'system':
      return `system:${actor.job}`;
    default:
      return 'anonymous';
  }
}

/** Stable JSON: object keys sorted, so the same body always hashes the same. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function requestHash(method: string, path: string, body: unknown): string {
  return createHash('sha256')
    .update(`${method} ${path}\n${canonical(body)}`)
    .digest('hex');
}

type StoredResult =
  { kind: 'empty' } | { kind: 'page'; items: unknown[]; meta: unknown } | { kind: 'value'; value: unknown };

function encode(result: unknown): StoredResult {
  if (result === undefined) return { kind: 'empty' };
  if (result instanceof Page) return { kind: 'page', items: result.items, meta: result.meta };
  return { kind: 'value', value: result };
}

function decode(stored: StoredResult): unknown {
  switch (stored.kind) {
    case 'empty':
      return undefined;
    case 'page':
      return new Page(stored.items, stored.meta as never);
    default:
      return stored.value;
  }
}

/**
 * Idempotency-Key handling for operations marked `@Idempotent()`. Registered
 * globally inside the envelope interceptor, so it stores the handler's raw
 * result; the envelope is applied again on replay. Errors are not stored: the
 * reservation is freed and the client may retry with the same key.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: IdempotencyStore,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<Required<IdempotentOptions> | undefined>(IDEMPOTENT_KEY, context.getHandler());
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const header = request.headers[IDEMPOTENCY_HEADER];
    const key = Array.isArray(header) ? header[0] : header;

    if (!key) {
      if (options.required) {
        throw new DomainError(
          ErrorCode.IDEMPOTENCY_KEY_REQUIRED,
          'This operation needs an Idempotency-Key header',
          HttpStatus.BAD_REQUEST,
        );
      }
      return next.handle();
    }
    if (!KEY_FORMAT.test(key)) {
      throw new DomainError(
        ErrorCode.IDEMPOTENCY_KEY_REQUIRED,
        'Idempotency-Key must be 1–255 characters of letters, digits, . _ : -',
        HttpStatus.BAD_REQUEST,
      );
    }

    const path = request.originalUrl ?? request.url;
    return from(
      this.store.begin({
        scope: idempotencyScope(RequestContext.actor()),
        key,
        method: request.method,
        path,
        requestHash: requestHash(request.method, path, request.body),
      }),
    ).pipe(
      mergeMap((begun) => {
        if (begun.kind === 'replay') {
          response.status(begun.status);
          response.setHeader('Idempotent-Replayed', 'true');
          return of(decode(begun.body as unknown as StoredResult));
        }
        return next.handle().pipe(
          mergeMap(async (result: unknown) => {
            await this.store.complete(
              begun.id,
              response.statusCode,
              encode(result) as unknown as Prisma.InputJsonValue,
            );
            return result;
          }),
          catchError((error: unknown) =>
            from(this.store.abandon(begun.id)).pipe(mergeMap(() => throwError(() => error))),
          ),
        );
      }),
    );
  }
}
