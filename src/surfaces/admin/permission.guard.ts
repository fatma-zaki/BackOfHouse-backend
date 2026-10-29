import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { staffHas } from '../../common/context/actor';
import { RequestContext } from '../../common/context/request-context';
import { ForbiddenError } from '../../common/errors';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator';

/**
 * Coarse permission check for admin routes, after SurfaceAuthGuard: a route marked
 * `@RequirePermission(key)` answers 403 `FORBIDDEN` unless the staff actor holds the
 * key. Routes without the decorator are not affected. Domain policies still check
 * again in the service, so the rule holds for jobs and other callers too.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) {
      return true;
    }
    if (!staffHas(RequestContext.actor(), permission)) {
      throw new ForbiddenError();
    }
    return true;
  }
}
