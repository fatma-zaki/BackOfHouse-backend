import { canChangeStatus, emailDomain, isWorkspaceEmail, STAFF_HOME, wouldRemoveLastSuperAdmin } from './staff';
import { STAFF_ROLES } from './permissions';

describe('staff rules', () => {
  it('has a home screen for every role', () => {
    expect(Object.keys(STAFF_HOME).sort()).toEqual([...STAFF_ROLES].sort());
  });

  it.each([
    ['reem@backofhouse.sa', true],
    ['REEM@BackOfHouse.SA', true],
    ['reem@backofhouse.sa.evil.com', false],
    ['reem@team.backofhouse.sa', false],
    ['reem@gmail.com', false],
    ['reem@backofhouse.sa@evil.com', false],
    ['no-at-sign', false],
  ])('workspace email %s → %s', (email, expected) => {
    expect(isWorkspaceEmail(email, 'backofhouse.sa')).toBe(expected);
  });

  it('accepts no email when the Workspace domain is not configured', () => {
    expect(isWorkspaceEmail('reem@backofhouse.sa', undefined)).toBe(false);
    expect(emailDomain('a@b.c')).toBe('b.c');
  });

  describe('LAST_SUPER_ADMIN', () => {
    const active = { role: 'SUPER_ADMIN' as const, status: 'ACTIVE' as const };
    it('refuses demoting or disabling the only active Super admin', () => {
      expect(
        wouldRemoveLastSuperAdmin({
          current: active,
          next: { ...active, role: 'REVIEWER' },
          otherActiveSuperAdmins: 0,
        }),
      ).toBe(true);
      expect(
        wouldRemoveLastSuperAdmin({
          current: active,
          next: { ...active, status: 'DISABLED' },
          otherActiveSuperAdmins: 0,
        }),
      ).toBe(true);
    });
    it('allows it when another active Super admin remains, or when nothing changes', () => {
      expect(
        wouldRemoveLastSuperAdmin({
          current: active,
          next: { ...active, role: 'REVIEWER' },
          otherActiveSuperAdmins: 1,
        }),
      ).toBe(false);
      expect(wouldRemoveLastSuperAdmin({ current: active, next: active, otherActiveSuperAdmins: 0 })).toBe(false);
      expect(
        wouldRemoveLastSuperAdmin({
          current: { role: 'SUPER_ADMIN', status: 'INVITED' },
          next: { role: 'REVIEWER', status: 'INVITED' },
          otherActiveSuperAdmins: 0,
        }),
      ).toBe(false);
    });
  });

  it.each([
    ['INVITED', 'ACTIVE', false],
    ['INVITED', 'DISABLED', true],
    ['ACTIVE', 'DISABLED', true],
    ['DISABLED', 'ACTIVE', true],
    ['ACTIVE', 'ACTIVE', true],
  ] as const)('status %s → %s allowed = %s', (from, to, allowed) => {
    expect(canChangeStatus(from, to)).toBe(allowed);
  });
});
