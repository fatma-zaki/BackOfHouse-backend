import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UnauthenticatedError } from '../errors';

/**
 * Deny by default (security-and-audit.md §3). Until the identity module adds
 * the Supabase JWT AuthGuard (Stage 4, blocked on TQ-01/TQ-02), the only
 * reachable routes are those marked @Public(); everything else answers 401.
 * Stage 4 replaces this guard with AuthGuard, which keeps the same @Public()
 * contract.
 */
@Injectable()
export class DenyByDefaultGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    throw new UnauthenticatedError();
  }
}
