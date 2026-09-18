import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { DatabaseService } from '../../database/database.service';
import { Role } from '../decorators/permissions.enum';
import { AuthenticatedRequest } from '../types/auth-context';
import { ForbiddenException, UnauthorizedException } from '../../common/exceptions/business.exceptions';
import { UserStatus } from '../../users/user.types';
import { FakeSupabaseClient } from '../../../test/support/fake-supabase';
import { Tables } from '../../common/constants';

const AUTH_ID = '22222222-2222-4222-8222-222222222222';
const PROFILE_ID = 'aaaa2222-2222-4222-8222-222222222222';

function contextFor(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function requestWith(token?: string): AuthenticatedRequest {
  return { headers: token ? { authorization: token } : {} };
}

describe('AuthGuard', () => {
  let supabase: FakeSupabaseClient;
  let guard: AuthGuard;

  beforeEach(() => {
    supabase = new FakeSupabaseClient();
    supabase.seed(
      Tables.USERS,
      [{ id: PROFILE_ID, auth_user_id: AUTH_ID, email: 'ada@example.test', status: UserStatus.Active }],
      [['auth_user_id']],
    );
    supabase.sessions.set('valid', {
      id: AUTH_ID,
      email: 'ada@example.test',
      app_metadata: { app_role: Role.USER },
      user_metadata: {},
    });

    guard = new AuthGuard({ admin: supabase } as unknown as DatabaseService);
  });

  it('rejects a request without an Authorization header', async () => {
    await expect(guard.canActivate(contextFor(requestWith()))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a header that is not a bearer token', async () => {
    await expect(guard.canActivate(contextFor(requestWith('Basic abc')))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an empty bearer token', async () => {
    await expect(guard.canActivate(contextFor(requestWith('Bearer   ')))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token Supabase does not recognise', async () => {
    await expect(guard.canActivate(contextFor(requestWith('Bearer forged')))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('populates the request with the verified identity', async () => {
    const request = requestWith('Bearer valid');

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      authUserId: AUTH_ID,
      profileId: PROFILE_ID,
      email: 'ada@example.test',
      role: Role.USER,
      accessToken: 'valid',
    });
  });

  it('ignores a role injected into client-writable user_metadata', async () => {
    supabase.sessions.set('escalation-attempt', {
      id: AUTH_ID,
      email: 'ada@example.test',
      app_metadata: {},
      // A client can set this itself through supabase.auth.updateUser().
      user_metadata: { app_role: Role.PLATFORM_ADMIN },
    });
    const request = requestWith('Bearer escalation-attempt');

    await guard.canActivate(contextFor(request));

    expect(request.user?.role).toBe(Role.USER);
  });

  it('falls back to the least privileged role for an unknown claim', async () => {
    supabase.sessions.set('odd-role', {
      id: AUTH_ID,
      email: 'ada@example.test',
      app_metadata: { app_role: 'SUPERUSER' },
      user_metadata: {},
    });
    const request = requestWith('Bearer odd-role');

    await guard.canActivate(contextFor(request));

    expect(request.user?.role).toBe(Role.USER);
  });

  it('refuses a suspended account', async () => {
    supabase.rowsOf(Tables.USERS)[0]['status'] = UserStatus.Suspended;

    await expect(guard.canActivate(contextFor(requestWith('Bearer valid')))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('provisions a profile the first time a Supabase account calls the API', async () => {
    supabase.seed(Tables.USERS, [], [['auth_user_id']]);
    const request = requestWith('Bearer valid');

    await guard.canActivate(contextFor(request));

    expect(supabase.rowsOf(Tables.USERS)).toHaveLength(1);
    expect(request.user?.profileId).toBe(supabase.rowsOf(Tables.USERS)[0]['id']);
  });
});
