import { Controller, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { Actor } from '../../common/context/actor';
import { RequestContext } from '../../common/context/request-context';
import { AppAccountGuard, CompanyAccountOnly, IndividualsOnly } from './account-context';

@CompanyAccountOnly()
@Controller()
class Workspace {
  @Get() view(): void {}
  @Get() @CompanyAccountOnly('EDIT_PROFILE') edit(): void {}
}

@IndividualsOnly()
@Controller()
class Discover {
  @Get() list(): void {}
}

class Open {
  ping(): void {}
}

const contextOf = (target: object, handler: () => void) =>
  ({ getHandler: () => handler, getClass: () => target }) as unknown as ExecutionContext;

const guard = new AppAccountGuard(new Reflector());
const check = (actor: Actor | undefined, target: object, handler: () => void) =>
  RequestContext.run({ requestId: 't', actor }, () => guard.canActivate(contextOf(target, handler)));

const member: Actor = { kind: 'member', userId: 'u', isStudent: false };
const company = (permissions: string[]): Actor => ({ kind: 'company', userId: 'u', companyId: 'c', permissions });

describe('AppAccountGuard', () => {
  it('lets the right account type through', () => {
    expect(check(company([]), Workspace, Workspace.prototype.view)).toBe(true);
    expect(check(member, Discover, Discover.prototype.list)).toBe(true);
  });

  it('refuses the wrong account type with FORBIDDEN', () => {
    expect(() => check(member, Workspace, Workspace.prototype.view)).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' }),
    );
    expect(() => check(company(['EDIT_PROFILE']), Discover, Discover.prototype.list)).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' }),
    );
  });

  it('refuses a Company Account without the route permission with PERMISSION_DENIED', () => {
    expect(() => check(company(['MANAGE_PROJECTS']), Workspace, Workspace.prototype.edit)).toThrow(
      expect.objectContaining({ code: 'PERMISSION_DENIED', status: 403 }),
    );
    expect(check(company(['EDIT_PROFILE']), Workspace, Workspace.prototype.edit)).toBe(true);
  });

  it('ignores routes without the decorators', () => {
    expect(check(undefined, Open, Open.prototype.ping)).toBe(true);
  });
});
