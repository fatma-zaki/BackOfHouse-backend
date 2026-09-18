import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../../config/app.config';

/**
 * Global per-client throttling. In memory, which is correct for a single api
 * instance; a shared store is required before scaling out (TQ-16, ADR-013).
 * Route classes with tighter limits (security-and-audit.md §5) apply @Throttle
 * on their controllers as those routes are built.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ ttl: config.rateLimit.ttlMs, limit: config.rateLimit.limit }],
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
