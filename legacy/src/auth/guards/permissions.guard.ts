import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, hasPermission } from '../decorators/permissions.enum';
import { AuthenticatedRequest } from '../types/auth-context';
import { ForbiddenException, UnauthorizedException } from '../../common/exceptions/business.exceptions';

/**
 * Enforces the permissions declared with `@RequirePermissions(...)`.
 * Runs after AuthGuard and only reads the verified request identity.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const missing = required.filter((permission) => !hasPermission(user.role, permission));

    if (missing.length > 0) {
      this.logger.warn(`Denied ${user.profileId} (${user.role}): missing ${missing.join(', ')}`);
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
