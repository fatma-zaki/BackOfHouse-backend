import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission, Role, ROLE_PERMISSIONS, hasPermission } from '../decorators/permissions.enum';
import { AuthContext, AuthenticatedRequest } from '../types/auth-context';
import { ForbiddenException, UnauthorizedException } from '../../common/exceptions/business.exceptions';

function contextWith(user: AuthContext | undefined): ExecutionContext {
  const request: AuthenticatedRequest = { headers: {}, user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function userWith(role: Role): AuthContext {
  return {
    authUserId: '22222222-2222-4222-8222-222222222222',
    profileId: 'aaaa2222-2222-4222-8222-222222222222',
    email: 'ada@example.test',
    role,
    accessToken: 'token',
  };
}

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;
  let required: Permission[] | undefined;

  beforeEach(() => {
    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(() => required);
    guard = new PermissionsGuard(reflector);
  });

  it('allows a handler that declares no permissions', () => {
    required = [];

    expect(guard.canActivate(contextWith(userWith(Role.USER)))).toBe(true);
  });

  it('rejects when the request carries no identity', () => {
    required = [Permission.REWARD_READ];

    expect(() => guard.canActivate(contextWith(undefined))).toThrow(UnauthorizedException);
  });

  it('allows a role that holds the permission', () => {
    required = [Permission.REWARD_REDEEM];

    expect(guard.canActivate(contextWith(userWith(Role.USER)))).toBe(true);
  });

  it('rejects a role that lacks the permission', () => {
    required = [Permission.REWARD_MANAGE];

    expect(() => guard.canActivate(contextWith(userWith(Role.USER)))).toThrow(ForbiddenException);
  });

  it('requires every declared permission, not just one', () => {
    required = [Permission.REWARD_READ, Permission.REWARD_MANAGE];

    expect(() => guard.canActivate(contextWith(userWith(Role.USER)))).toThrow(ForbiddenException);
  });

  it('allows a platform administrator', () => {
    required = [Permission.REWARD_MANAGE, Permission.AUDIT_READ, Permission.POINTS_ADJUST];

    expect(guard.canActivate(contextWith(userWith(Role.PLATFORM_ADMIN)))).toBe(true);
  });
});

describe('role to permission mapping', () => {
  const privileged = [
    Permission.NEWS_PUBLISH,
    Permission.NEWS_MODERATE,
    Permission.COURSE_MANAGE,
    Permission.REWARD_MANAGE,
    Permission.REWARD_FULFIL,
    Permission.POINTS_ADJUST,
    Permission.AUDIT_READ,
    Permission.PROFILE_READ_PRIVATE,
    Permission.COMPANY_MANAGE_ANY,
    Permission.EVENT_MANAGE_ANY,
    Permission.OPPORTUNITY_MANAGE_ANY,
  ];

  it.each([Role.USER, Role.COMPANY_MEMBER, Role.COMPANY_ADMIN])(
    'withholds every privileged permission from %s',
    (role) => {
      for (const permission of privileged) {
        expect(hasPermission(role, permission)).toBe(false);
      }
    },
  );

  it('grants a platform administrator every permission', () => {
    for (const permission of Object.values(Permission)) {
      expect(hasPermission(Role.PLATFORM_ADMIN, permission)).toBe(true);
    }
  });

  it('lets an ordinary member take part in the ecosystem', () => {
    const expected = [
      Permission.NEWS_READ,
      Permission.NEWS_COMMENT,
      Permission.COURSE_ENROLL,
      Permission.EVENT_REGISTER,
      Permission.REWARD_REDEEM,
      Permission.POINTS_READ_OWN,
    ];

    for (const permission of expected) {
      expect(hasPermission(Role.USER, permission)).toBe(true);
    }
  });

  it('defines a permission set for every role', () => {
    for (const role of Object.values(Role)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
