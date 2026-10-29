import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Actor } from '../common/context/actor';
import { RequestContext } from '../common/context/request-context';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { UnauthenticatedError } from '../common/errors';
import { ADMIN_ACTOR_RESOLVER, APP_ACTOR_RESOLVER, ActorResolver } from './actor-resolver';
import { Surface, SURFACE_PREFIXES } from './surface-paths';

/** Which surface a request path belongs to; null for shared routes (health). */
export function surfaceOf(path: string): Surface | null {
  for (const [surface, prefix] of Object.entries(SURFACE_PREFIXES) as [Surface, string][]) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return surface;
    }
  }
  return null;
}

const ALLOWED_KINDS: Record<Surface, ReadonlyArray<Actor['kind']>> = {
  app: ['member', 'company'],
  admin: ['staff'],
};

/**
 * Deny by default, per surface (security-and-audit.md §3, execution-plan.md §1.3).
 * `@Public()` routes pass. Every other route needs an actor from its own surface's
 * resolver; an actor of the wrong kind (a member on the admin surface, staff on the
 * app surface) is treated as no credential: 401. The actor goes into RequestContext
 * for controllers, policies and audit.
 */
@Injectable()
export class SurfaceAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(APP_ACTOR_RESOLVER) private readonly appResolver: ActorResolver,
    @Inject(ADMIN_ACTOR_RESOLVER) private readonly adminResolver: ActorResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const surface = surfaceOf(request.path);
    if (!surface) {
      throw new UnauthenticatedError();
    }

    const resolver = surface === 'admin' ? this.adminResolver : this.appResolver;
    const actor = await resolver.resolve(request);
    if (!actor || !ALLOWED_KINDS[surface].includes(actor.kind)) {
      throw new UnauthenticatedError();
    }

    RequestContext.setActor(actor);
    return true;
  }
}
