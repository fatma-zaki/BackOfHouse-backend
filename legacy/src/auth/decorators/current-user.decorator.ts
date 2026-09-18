import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext, AuthenticatedRequest } from '../types/auth-context';
import { UnauthorizedException } from '../../common/exceptions/business.exceptions';

/**
 * Injects the verified caller. Throws if used on a route without AuthGuard,
 * so a handler can never silently receive an undefined identity.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) {
    throw new UnauthorizedException('Authentication required');
  }
  return request.user;
});

export { AuthContext } from '../types/auth-context';
