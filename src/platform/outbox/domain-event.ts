import { SetMetadata } from '@nestjs/common';

/** Who caused the event (domain-events.md §1 envelope). */
export interface EventActor {
  type: 'USER' | 'STAFF' | 'SYSTEM';
  user_id: string | null;
}

/** What a producer passes to OutboxWriter.emit(). */
export interface DomainEventInput<TData extends object = Record<string, unknown>> {
  /** `<aggregate>.<past-tense-fact>`, e.g. `organization.claim.approved`. */
  name: string;
  version?: number;
  aggregateType: string;
  aggregateId: string;
  actor: EventActor;
  organizationId?: string;
  /** Ids and minimal facts only: no emails, phone numbers or document contents. */
  data: TData;
}

/** The envelope delivered to handlers (domain-events.md §1). */
export interface DomainEvent<TData extends object = Record<string, unknown>> {
  event_id: string;
  event_name: string;
  event_version: number;
  occurred_at: string;
  aggregate_type: string;
  aggregate_id: string;
  actor: EventActor;
  organization_id: string | null;
  request_id: string;
  payload: TData;
}

/**
 * Shape of `outbox_events.payload`. The catalog stores event name, aggregate
 * and timestamps as columns; the remaining envelope fields live here.
 */
export interface StoredEventPayload {
  event_version: number;
  actor: EventActor;
  organization_id: string | null;
  request_id: string;
  data: Record<string, unknown>;
}

export const DOMAIN_EVENT_HANDLER = 'boh:domain_event_handler';

/**
 * Subscribes a provider method to an event name. Handlers must be idempotent:
 * delivery is at least once (ADR-011).
 */
export const OnDomainEvent = (eventName: string): MethodDecorator => SetMetadata(DOMAIN_EVENT_HANDLER, eventName);
