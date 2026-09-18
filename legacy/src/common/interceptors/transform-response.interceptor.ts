import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  data: T;
}

function isPaginated(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'data' in value && 'meta' in value;
}

/**
 * Guarantees a single success envelope: `{ data }` for single resources and
 * `{ data, meta }` for paginated collections, which are passed through as-is.
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T> | T> {
    return next.handle().pipe(map((payload) => (isPaginated(payload) ? payload : { data: payload })));
  }
}
