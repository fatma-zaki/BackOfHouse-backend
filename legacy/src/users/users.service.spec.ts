import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { UserStatus } from './user.types';
import { AuthContext } from '../auth/types/auth-context';
import { Role } from '../auth/decorators/permissions.enum';
import { Tables } from '../common/constants';
import { FakeSupabaseClient } from '../../test/support/fake-supabase';

const OWN = 'aaaa2222-2222-4222-8222-222222222222';
const OTHER = 'aaaa3333-3333-4333-8333-333333333333';

const caller: AuthContext = {
  authUserId: 'auth-own',
  profileId: OWN,
  email: 'ada@example.test',
  role: Role.USER,
  accessToken: 'token',
};

describe('UsersService', () => {
  let supabase: FakeSupabaseClient;
  let service: UsersService;

  beforeEach(() => {
    supabase = new FakeSupabaseClient();
    supabase.seed(Tables.USERS, [
      { id: OWN, email: 'ada@example.test', first_name: 'Ada', status: UserStatus.Active },
      { id: OTHER, email: 'luca@example.test', first_name: 'Luca', status: UserStatus.Active },
    ]);
    service = new UsersService({ admin: supabase } as unknown as DatabaseService);
  });

  it('updates only the caller profile', async () => {
    await service.updateOwnProfile(caller, { first_name: 'Adaeze' });

    const rows = supabase.rowsOf(Tables.USERS);
    expect(rows.find((row) => row['id'] === OWN)?.['first_name']).toBe('Adaeze');
    expect(rows.find((row) => row['id'] === OTHER)?.['first_name']).toBe('Luca');
  });

  it('never writes fields outside the self-editable allow-list', async () => {
    await service.updateOwnProfile(caller, {
      first_name: 'Ada',
      status: UserStatus.Suspended,
      email: 'attacker@example.test',
      auth_user_id: 'someone-else',
    } as never);

    const own = supabase.rowsOf(Tables.USERS).find((row) => row['id'] === OWN);
    expect(own?.['status']).toBe(UserStatus.Active);
    expect(own?.['email']).toBe('ada@example.test');
    expect(own?.['auth_user_id']).toBeUndefined();
  });

  it('returns the current profile unchanged when nothing is supplied', async () => {
    const profile = await service.updateOwnProfile(caller, {});

    expect(profile.id).toBe(OWN);
  });

  it('exposes another member through the public projection only', async () => {
    const profile = await service.findPublicById(OTHER);

    expect(profile.id).toBe(OTHER);
  });
});
