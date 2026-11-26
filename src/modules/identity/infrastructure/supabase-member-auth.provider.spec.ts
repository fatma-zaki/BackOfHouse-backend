import { createClient } from '@supabase/supabase-js';
import type { Clock } from '../../../common/clock/clock';
import { SupabaseMemberAuthProvider } from './supabase-member-auth.provider';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'sara@example.com';

const session = (userId: string) => ({
  access_token: 'access',
  refresh_token: 'refresh',
  expires_in: 3600,
  user: { id: userId },
});

function setup() {
  const admin = {
    getUserById: jest.fn().mockResolvedValue({ data: { user: { id: USER_ID, email: EMAIL } }, error: null }),
    generateLink: jest.fn().mockResolvedValue({
      data: { properties: { hashed_token: 'hash' }, user: { id: USER_ID } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
  const verifyOtp = jest.fn().mockResolvedValue({ data: { session: session(USER_ID) }, error: null });
  (createClient as jest.Mock).mockReturnValue({ auth: { admin, verifyOtp } });
  const clock: Clock = { now: () => new Date('2026-11-26T12:00:00Z') } as Clock;
  const provider = new SupabaseMemberAuthProvider({ url: 'https://project.supabase.co', secretKey: 'secret' }, clock);
  return { provider, admin, verifyOtp };
}

describe('SupabaseMemberAuthProvider.createSession', () => {
  it('mints a session for an existing auth user with the same id and email', async () => {
    const { provider, admin } = setup();

    await expect(provider.createSession({ userId: USER_ID, email: EMAIL })).resolves.toEqual({
      userId: USER_ID,
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 3600,
    });
    expect(admin.generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: EMAIL });
  });

  it('refuses an account with no auth user, without generating a link (which would create one)', async () => {
    const { provider, admin } = setup();
    admin.getUserById.mockResolvedValue({ data: { user: null }, error: { status: 404, code: 'user_not_found' } });

    await expect(provider.createSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(/no Supabase Auth user/);
    expect(admin.generateLink).not.toHaveBeenCalled();
  });

  it('refuses when the auth user has another email', async () => {
    const { provider, admin } = setup();
    admin.getUserById.mockResolvedValue({ data: { user: { id: USER_ID, email: 'other@example.com' } }, error: null });

    await expect(provider.createSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(/different email/);
    expect(admin.generateLink).not.toHaveBeenCalled();
  });

  it('refuses a link generated for another user', async () => {
    const { provider, admin, verifyOtp } = setup();
    admin.generateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'hash' }, user: { id: OTHER_ID } },
      error: null,
    });

    await expect(provider.createSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(/another user/);
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('signs out and refuses a session that belongs to another user', async () => {
    const { provider, admin, verifyOtp } = setup();
    verifyOtp.mockResolvedValue({ data: { session: session(OTHER_ID) }, error: null });

    await expect(provider.createSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(/another user/);
    expect(admin.signOut).toHaveBeenCalledWith('access', 'local');
  });
});
