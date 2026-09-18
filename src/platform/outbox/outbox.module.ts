import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { OutboxWriter } from './outbox-writer';
import { OutboxHandlerRegistry } from './outbox-handler.registry';
import { OutboxDispatcher } from './outbox-dispatcher';

/**
 * The writer is used by producers in both processes; the dispatcher only runs
 * in the worker (started by WorkerLifecycle when JOBS_ENABLED=true).
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [OutboxWriter, OutboxHandlerRegistry, OutboxDispatcher],
  exports: [OutboxWriter, OutboxHandlerRegistry, OutboxDispatcher],
})
export class OutboxModule {}
