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
import { IdempotencyInterceptor, IdempotencyModule } from './platform/idempotency';
import { ClockModule } from './platform/clock/clock.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import { SurfaceAuthGuard } from './surfaces/surface-auth.guard';
import { PermissionGuard } from './surfaces/admin/permission.guard';
import { AuditAssertInterceptor } from './surfaces/admin/audit-assert.interceptor';
import { AuditReadInterceptor } from './surfaces/audit-read';
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
    ClockModule,
    ObservabilityModule,
    RateLimitModule,
    DatabaseModule,
    OutboxModule,
    AuditModule,
    WorkerRuntimeModule,
    IdempotencyModule,
    SurfacesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard order: rate limit first, then authentication (security-and-audit.md §1).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Then deny by default per surface (actor from the surface's resolver), then admin permission keys.
    { provide: APP_GUARD, useClass: SurfaceAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: the envelope wraps the idempotency interceptor, which stores raw results.
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    // Audit: sensitive reads (@AuditRead) and the every-admin-write-is-audited check.
    { provide: APP_INTERCEPTOR, useClass: AuditReadInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditAssertInterceptor },
  ],
})
export class AppModule {}
