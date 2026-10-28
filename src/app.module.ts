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
import { SurfacesModule } from './surfaces/surfaces.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import { DenyByDefaultGuard } from './common/guards/deny-by-default.guard';
import { createValidationPipe } from './common/pipes/validation.pipe';

/**
 * The `api` process (ADR-022). Platform modules, audit and the two API surfaces
 * (ADR-031): every controller lives in src/surfaces/app or src/surfaces/admin,
 * except the shared health probes. Domain modules are added phase by phase
 * (docs/execution-plan.md).
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
    SurfacesModule,
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
