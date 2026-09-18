import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { WorkerLifecycle } from './worker-lifecycle';

@Module({
  imports: [JobsModule],
  providers: [WorkerLifecycle],
})
export class WorkerRuntimeModule {}
