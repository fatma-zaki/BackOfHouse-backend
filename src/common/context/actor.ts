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

/** True when the actor is staff holding the permission key. */
export function staffHas(actor: Actor | undefined, permission: string): actor is StaffActor {
  return actor?.kind === 'staff' && actor.permissions.includes(permission);
}
