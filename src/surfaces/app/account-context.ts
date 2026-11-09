import { CanActivate, ExecutionContext, HttpStatus, Injectable, SetMetadata, applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContext } from '../../common/context/request-context';
import { DomainError, ErrorCode, ForbiddenError } from '../../common/errors';
import type { CompanyPermission } from '../../modules/companies';

const APP_ACCOUNT_KEY = 'boh:app_account';
const COMPANY_PERMISSION_KEY = 'boh:company_permission';

/** `/me/*` and Discover: individuals only (docs/app/README.md §2 "Who may call what"). */
export const IndividualsOnly = (): MethodDecorator & ClassDecorator => SetMetadata(APP_ACCOUNT_KEY, 'member');

/** `/company/*`: Company Accounts only, optionally with a company permission (ADR-030, P3). */
export const CompanyAccountOnly = (permission?: CompanyPermission): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(APP_ACCOUNT_KEY, 'company'),
    ...(permission ? [SetMetadata(COMPANY_PERMISSION_KEY, permission)] : []),
  );

/**
 * Coarse account-type check for app routes, after SurfaceAuthGuard: the wrong account type
 * gets 403 `FORBIDDEN` and a Company Account without the route's permission 403
 * `PERMISSION_DENIED`. Routes without the decorators are not affected; the services check
 * again (requireMember, requireCompanyActor).
 */
@Injectable()
export class AppAccountGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const account = this.reflector.getAllAndOverride<'member' | 'company' | undefined>(APP_ACCOUNT_KEY, targets);
    if (!account) return true;
    const actor = RequestContext.actor();
    if (actor?.kind !== account) throw new ForbiddenError();
    const permission = this.reflector.getAllAndOverride<string | undefined>(COMPANY_PERMISSION_KEY, targets);
    if (permission && actor.kind === 'company' && !actor.permissions.includes(permission)) {
      throw new DomainError(ErrorCode.PERMISSION_DENIED, `Needs the ${permission} permission`, HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
