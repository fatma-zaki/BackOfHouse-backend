import type { Request } from 'express';
import type { Actor } from '../../src/common/context/actor';
import { permissionsForRole, StaffRole } from '../../src/modules/access';
import type { ActorResolver } from '../../src/surfaces/actor-resolver';

/** Fixed ids so tests can assert on audit rows. */
export const TEST_STAFF_ID = '0191f0a0-0000-7000-8000-00000000a001';
export const TEST_USER_ID = '0191f0a0-0000-7000-8000-00000000b001';

export function staffActor(role: StaffRole, staffId = TEST_STAFF_ID): Actor {
  return { kind: 'staff', staffId, role, permissions: permissionsForRole(role) };
}

export function memberActor(userId = TEST_USER_ID): Actor {
  return { kind: 'member', userId, isStudent: false };
}

/**
 * Stand-in for the Phase 2 resolvers, for tests only. Send `x-test-actor: staff:SUPER_ADMIN`,
 * `x-test-actor: staff:REVIEWER` or `x-test-actor: member` to act as that caller; any other
 * request has no credential. Register with `.overrideProvider(ADMIN_ACTOR_RESOLVER)` and
 * `.overrideProvider(APP_ACTOR_RESOLVER)`.
 */
export class TestHeaderActorResolver implements ActorResolver {
  async resolve(request: Request): Promise<Actor | null> {
    const header = request.headers['x-test-actor'];
    const value = Array.isArray(header) ? header[0] : header;
    if (value === 'member') return memberActor();
    if (value?.startsWith('staff:')) return staffActor(value.slice('staff:'.length) as StaffRole);
    return null;
  }
}
