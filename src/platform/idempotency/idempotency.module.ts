import { Module } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyStore } from './idempotency.store';

/**
 * Idempotency-Key store and interceptor (nest-module-map.md §3 `platform/idempotency`).
 * The interceptor is registered globally in app.module, after the envelope
 * interceptor; the worker uses the store to purge expired records.
 */
@Module({
  providers: [IdempotencyStore, IdempotencyInterceptor],
  exports: [IdempotencyStore, IdempotencyInterceptor],
})
export class IdempotencyModule {}
