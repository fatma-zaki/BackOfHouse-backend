import { Actor, staffHas, StaffActor } from '../../../common/context/actor';
import { ForbiddenError } from '../../../common/errors';

// Keys from the staff permission catalog (modules/access). Plain strings here:
// access depends on settings (session idle timeout), so settings must not import access.
const VIEW = 'settings.view';
const MANAGE = 'settings.manage';

/**
 * Who may read and change platform settings (Super admin only, hand-off doc 02).
 * Checked in the service as well as by the route guard (execution-plan.md §1.4).
 */
export function assertCanViewSettings(actor: Actor | undefined): asserts actor is StaffActor {
  if (!staffHas(actor, VIEW)) {
    throw new ForbiddenError('Only staff with settings.view can read platform settings');
  }
}

export function assertCanManageSettings(actor: Actor | undefined): asserts actor is StaffActor {
  if (!staffHas(actor, MANAGE)) {
    throw new ForbiddenError('Only staff with settings.manage can change platform settings');
  }
}
