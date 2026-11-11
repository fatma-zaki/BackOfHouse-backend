import type { Actor, StaffActor } from '../../../common/context/actor';
import { staffHas } from '../../../common/context/actor';
import { ForbiddenError } from '../../../common/errors';

/**
 * "Companies to Watch" is editorial and free, never a paid placement (business-rules.md),
 * and only a Super admin chooses it (`companies.feature`, contracts/admin PATCH
 * /companies/{id}). Every path that sets `editors_pick` or `featured_order` goes through
 * here, whoever calls it.
 */
export function requireFeaturePermission(actor: Actor | undefined): StaffActor {
  if (!staffHas(actor, 'companies.feature')) {
    throw new ForbiddenError('Only a Super admin can feature companies');
  }
  return actor;
}
