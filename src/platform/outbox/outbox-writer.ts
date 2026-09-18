import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';
import { RequestContext } from '../../common/context/request-context';
import { uuidv7 } from '../../common/ids/uuid-v7';
import type { Prisma } from '../../generated/prisma/client';
import { DomainEventInput, StoredEventPayload } from './domain-event';

const EVENT_NAME = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/**
 * Publishes a domain event by inserting it into `outbox_events` in the
 * caller's transaction: the event exists if and only if the state change
 * committed (ADR-011). Throws when called outside TransactionRunner.run().
 */
@Injectable()
export class OutboxWriter {
  constructor(private readonly transactions: TransactionRunner) {}

  async emit<TData extends object>(event: DomainEventInput<TData>): Promise<string> {
    if (!EVENT_NAME.test(event.name)) {
      throw new Error(`Invalid event name "${event.name}"; expected <aggregate>.<past-tense-fact>`);
    }

    const tx = this.transactions.requireTransaction('OutboxWriter.emit');
    const id = uuidv7();
    const payload: StoredEventPayload = {
      event_version: event.version ?? 1,
      actor: event.actor,
      organization_id: event.organizationId ?? null,
      request_id: RequestContext.requestId(),
      data: event.data as Record<string, unknown>,
    };

    await tx.outboxEvent.create({
      data: {
        id,
        eventName: event.name,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return id;
  }
}
