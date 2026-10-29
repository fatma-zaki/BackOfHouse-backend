import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ObservabilityModule } from './platform/observability/observability.module';
import { DatabaseModule } from './platform/database/database.module';
import { OutboxModule } from './platform/outbox/outbox.module';
import { WorkerRuntimeModule } from './platform/worker-runtime/worker-runtime.module';
import { ClockModule } from './platform/clock/clock.module';
import { AccessModule } from './modules/access';
import { AuditModule } from './modules/audit/audit.module';

/**
 * The `worker` process (ADR-022): outbox dispatcher and scheduled jobs, no HTTP.
 * Domain modules that consume events (@OnDomainEvent) are imported here as
 * they are built.
 */
@Module({
  imports: [
    ConfigModule,
    ClockModule,
    ObservabilityModule,
    DatabaseModule,
    OutboxModule,
    AuditModule,
    WorkerRuntimeModule,
    // Domain modules that declare scheduled jobs (JobsService.defineCron).
    AccessModule,
  ],
})
export class WorkerModule {}
