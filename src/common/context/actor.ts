import { ForbiddenError } from '../errors';

/**
 * Who is calling (execution-plan.md §1.4). Built by the surface auth guard and
 * passed explicitly into every service method, so business rules hold whichever
 * surface, job or event handler calls a service.
 *
 * Permission keys are plain strings here; the typed catalog lives in
 * modules/access (common/ never imports domain modules).
 */
export type Actor =
  | { kind: 'member'; userId: string; isStudent: boolean }
  /** ADR-030: one Company Account per company; permissions so roles can be added later (P3). */
  | { kind: 'company'; userId: string; companyId: string; permissions: readonly string[] }
  | { kind: 'staff'; staffId: string; role: string; permissions: readonly string[] }
  | { kind: 'system'; job: string };

export type StaffActor = Extract<Actor, { kind: 'staff' }>;
export type MemberActor = Extract<Actor, { kind: 'member' }>;

/** True when the actor is staff holding the permission key. */
export function staffHas(actor: Actor | undefined, permission: string): actor is StaffActor {
  return actor?.kind === 'staff' && actor.permissions.includes(permission);
}

/**
 * `/me/*` and Discover (`/companies`, `/professionals`) are for individuals only; a
 * Company Account gets 403 `FORBIDDEN` (docs/app/README.md §2 "Who may call what").
 */
export function requireMember(actor: Actor | undefined): MemberActor {
  if (actor?.kind !== 'member') throw new ForbiddenError('This is for individual accounts');
  return actor;
}
