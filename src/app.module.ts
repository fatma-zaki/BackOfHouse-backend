import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { ObservabilityModule } from './platform/observability/observability.module';
import { HealthController } from './platform/observability/health.controller';
import { RateLimitModule } from './platform/rate-limit/rate-limit.module';
import { DatabaseModule } from './platform/database/database.module';
import { OutboxModule } from './platform/outbox/outbox.module';
import { WorkerRuntimeModule } from './platform/worker-runtime/worker-runtime.module';
import { AuditModule } from './modules/audit/audit.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import { DenyByDefaultGuard } from './common/guards/deny-by-default.guard';
import { createValidationPipe } from './common/pipes/validation.pipe';

/**
 * The `api` process (ADR-022). Stages 1–3: platform modules and audit only.
 * Domain modules are added from Stage 4 (identity) onwards, in the order of
 * backend-development-order.md.
 */
@Module({
  imports: [
    ConfigModule,
    ObservabilityModule,
    RateLimitModule,
    DatabaseModule,
    OutboxModule,
    AuditModule,
    WorkerRuntimeModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard order: rate limit first, then authentication (security-and-audit.md §1).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: DenyByDefaultGuard },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
  ],
})
export class AppModule {}
