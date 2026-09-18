import { SetMetadata } from '@nestjs/common';
import { Permission } from './permissions.enum';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Declares the permissions a handler requires.
 * Enforced by PermissionsGuard; use via `@Auth(...)` so the auth guard runs too.
 */
export const RequirePermissions = (...permissions: Permission[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
