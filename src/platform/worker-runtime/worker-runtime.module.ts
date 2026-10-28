import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { WorkerLifecycle } from './worker-lifecycle';

@Module({
  imports: [JobsModule, IdempotencyModule],
  providers: [WorkerLifecycle],
})
export class WorkerRuntimeModule {}
