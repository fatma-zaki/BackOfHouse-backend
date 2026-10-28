import type { Actor } from '../../common/context/actor';
import { AuditActorType } from '../../generated/prisma/enums';

export { AuditActorType };

export interface AuditActor {
  type: AuditActorType;
  /** Required for USER and STAFF (enforced by ck_audit_logs__actor_user_required). */
  userId?: string;
  /** Staff roles held at the time of the action. */
  platformRoles?: string[];
}

export interface AuditRecordInput {
  actor: AuditActor;
  /** Dotted verb, e.g. `organization.claim.approve` (database-entities.md §12). */
  action: string;
  entityType: string;
  entityId: string;
  organizationId?: string;
  /** `{ before, after }`; redacted before storage. */
  changes?: { before?: unknown; after?: unknown };
  /** Mandatory for admin overrides (security-and-audit.md §4). */
  reason?: string;
}

export const SYSTEM_ACTOR: AuditActor = { type: AuditActorType.SYSTEM };

/**
 * The audit actor for a request actor. Staff are not `users` rows (ADR-032): their
 * staff account id goes in `actor_user_id` with type STAFF, so that column's
 * foreign key, when identity lands, must not point at `users` for STAFF rows.
 */
export function auditActorOf(actor: Actor | undefined): AuditActor {
  switch (actor?.kind) {
    case 'staff':
      return { type: AuditActorType.STAFF, userId: actor.staffId, platformRoles: [actor.role] };
    case 'member':
    case 'company':
      return { type: AuditActorType.USER, userId: actor.userId };
    default:
      return SYSTEM_ACTOR;
  }
}
