import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Page } from '../pagination/page';

export interface Envelope<T> {
  data: T;
  meta?: unknown;
}

/**
 * Success envelope (ADR-008): `{ data }` for a single resource and
 * `{ data, meta }` for a Page. Handlers returning nothing (204) are untouched.
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Envelope<unknown> | undefined> {
    return next.handle().pipe(
      map((payload: unknown) => {
        if (payload === undefined) {
          return undefined;
        }
        if (payload instanceof Page) {
          return { data: payload.items, meta: payload.meta };
        }
        return { data: payload };
      }),
    );
  }
}
