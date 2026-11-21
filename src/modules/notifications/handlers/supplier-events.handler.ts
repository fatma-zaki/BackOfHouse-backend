import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const submitted = z.object({
  request_id: z.string().uuid(),
  request_title: z.string(),
  buyer_user_id: z.string().uuid().nullable(),
  responder_name: z.string(),
});
const changed = z.object({
  request_id: z.string().uuid(),
  request_title: z.string(),
  responder_user_id: z.string().uuid().nullable(),
  buyer_name: z.string(),
  status: z.string(),
});

/** Supplier responses (Phase 5C): the buyer hears of new responses, the responder of every move. */
@Injectable()
export class SupplierEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('supplier_response.submitted')
  async submitted(event: DomainEvent): Promise<void> {
    const data = submitted.parse(event.payload);
    if (!data.buyer_user_id) return;
    await this.notifications.notify(event, {
      type: 'supplier.response_received',
      recipientUserIds: [data.buyer_user_id],
      payload: { request_title: data.request_title, responder_name: data.responder_name },
      target: { type: 'OPPORTUNITY', id: data.request_id },
    });
  }

  @OnDomainEvent('supplier_response.status_changed')
  async statusChanged(event: DomainEvent): Promise<void> {
    const data = changed.parse(event.payload);
    if (!data.responder_user_id) return;
    await this.notifications.notify(event, {
      type: 'supplier.response_status_changed',
      recipientUserIds: [data.responder_user_id],
      payload: { request_title: data.request_title, buyer_name: data.buyer_name, status: data.status },
      target: { type: 'OPPORTUNITY', id: data.request_id },
    });
  }
}
