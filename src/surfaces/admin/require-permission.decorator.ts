import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../../modules/access';

export const REQUIRED_PERMISSION_KEY = 'boh:required_permission';

/**
 * The permission key an admin route needs (docs/admin/docs/02-roles-and-permissions.md).
 * Must equal the operation's `x-permission` in contracts/admin/openapi.yaml.
 * This is the coarse check; role-dependent rules live in the domain policies.
 */
export const RequirePermission = (permission: PermissionKey): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
