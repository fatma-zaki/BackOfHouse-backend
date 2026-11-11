import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { TeamService } from '../../access';
import { AccountStatusService } from '../../identity';
import { BULK_USER_ACTION_EVENT } from '../services/users-admin.service';

const bulkEvent = z.object({
  action: z.literal('SUSPEND'),
  user_ids: z.array(z.string().uuid()),
  staff_id: z.string().uuid(),
});

/**
 * Carries out a bulk user action in the worker. Permissions are checked as they are now: a
 * staff member disabled since the request changes nothing. Idempotent: accounts already
 * suspended are skipped, so a redelivered event does no harm.
 */
@Injectable()
export class BulkUserActionsHandler {
  private readonly logger = new Logger(BulkUserActionsHandler.name);

  constructor(
    private readonly team: TeamService,
    private readonly accounts: AccountStatusService,
  ) {}

  @OnDomainEvent(BULK_USER_ACTION_EVENT)
  async run(event: DomainEvent): Promise<void> {
    const data = bulkEvent.parse(event.payload);
    const actor = await this.team.actorFor(data.staff_id);
    if (!actor) {
      this.logger.warn({ job_id: event.event_id }, 'Bulk action dropped: the staff member is no longer active');
      return;
    }
    const suspended = await this.accounts.suspendMany(actor, data.user_ids, 'Bulk suspension');
    this.logger.log({ job_id: event.event_id, suspended, requested: data.user_ids.length }, 'Bulk suspension done');
  }
}
