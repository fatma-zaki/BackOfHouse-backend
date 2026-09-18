import { CompaniesService } from './companies.service';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { CompanyRole, CompanyStatus } from './company.types';
import { AuthContext } from '../auth/types/auth-context';
import { Role } from '../auth/decorators/permissions.enum';
import { ConflictException, ForbiddenException, NotFoundException } from '../common/exceptions/business.exceptions';
import { Tables } from '../common/constants';
import { FakeSupabaseClient } from '../../test/support/fake-supabase';

const COMPANY_ID = 'bbbb1111-1111-4111-8111-111111111111';
const OTHER_COMPANY_ID = 'bbbb2222-2222-4222-8222-222222222222';
const ADMIN_PROFILE = 'aaaa1111-1111-4111-8111-111111111111';
const MEMBER_PROFILE = 'aaaa2222-2222-4222-8222-222222222222';
const OUTSIDER_PROFILE = 'aaaa3333-3333-4333-8333-333333333333';

function contextFor(profileId: string, role: Role = Role.USER): AuthContext {
  return {
    authUserId: `auth-${profileId}`,
    profileId,
    email: `${profileId}@example.test`,
    role,
    accessToken: 'token',
  };
}

describe('CompaniesService authorization', () => {
  let supabase: FakeSupabaseClient;
  let service: CompaniesService;
  let auditService: AuditService;

  beforeEach(() => {
    supabase = new FakeSupabaseClient();
    supabase.seed(Tables.COMPANIES, [
      {
        id: COMPANY_ID,
        name: 'Harbour Table Group',
        slug: 'harbour-table-group',
        industry: 'Hospitality',
        status: CompanyStatus.Active,
      },
      {
        id: OTHER_COMPANY_ID,
        name: 'Terra Produce Co-op',
        slug: 'terra-produce-co-op',
        industry: 'Food supply',
        status: CompanyStatus.Active,
      },
    ]);
    supabase.seed(
      Tables.COMPANY_MEMBERS,
      [
        { id: 'cm-1', company_id: COMPANY_ID, user_id: ADMIN_PROFILE, role: CompanyRole.Admin },
        { id: 'cm-2', company_id: COMPANY_ID, user_id: MEMBER_PROFILE, role: CompanyRole.Member },
        { id: 'cm-3', company_id: OTHER_COMPANY_ID, user_id: OUTSIDER_PROFILE, role: CompanyRole.Admin },
      ],
      [['company_id', 'user_id']],
    );
    supabase.seed(Tables.USERS, [
      { id: ADMIN_PROFILE },
      { id: MEMBER_PROFILE },
      { id: OUTSIDER_PROFILE },
    ]);
    supabase.seed(Tables.AUDIT_LOGS, []);

    const databaseService = { admin: supabase } as unknown as DatabaseService;
    auditService = new AuditService(databaseService);
    service = new CompaniesService(databaseService, auditService);
  });

  describe('update', () => {
    it('allows an administrator of that company', async () => {
      const company = await service.update(
        COMPANY_ID,
        { industry: 'Hospitality group' },
        contextFor(ADMIN_PROFILE),
      );

      expect(company.industry).toBe('Hospitality group');
    });

    it('refuses a plain member of that company', async () => {
      await expect(
        service.update(COMPANY_ID, { industry: 'Rewritten' }, contextFor(MEMBER_PROFILE)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses an administrator of a different company', async () => {
      await expect(
        service.update(COMPANY_ID, { industry: 'Rewritten' }, contextFor(OUTSIDER_PROFILE)),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const row = supabase.rowsOf(Tables.COMPANIES).find((entry) => entry['id'] === COMPANY_ID);
      expect(row?.['industry']).toBe('Hospitality');
    });

    it('allows a platform administrator', async () => {
      const company = await service.update(
        COMPANY_ID,
        { industry: 'Reviewed' },
        contextFor(OUTSIDER_PROFILE, Role.PLATFORM_ADMIN),
      );

      expect(company.industry).toBe('Reviewed');
    });

    it('only writes whitelisted fields', async () => {
      await service.update(
        COMPANY_ID,
        { name: 'Harbour Table', slug: 'hijacked', status: 'suspended' } as never,
        contextFor(ADMIN_PROFILE),
      );

      const row = supabase.rowsOf(Tables.COMPANIES).find((entry) => entry['id'] === COMPANY_ID);
      expect(row?.['name']).toBe('Harbour Table');
      expect(row?.['slug']).toBe('harbour-table-group');
      expect(row?.['status']).toBe(CompanyStatus.Active);
    });

    it('reports a missing company as 404 before checking membership', async () => {
      await expect(
        service.update('99999999-9999-4999-8999-999999999999', { name: 'x' }, contextFor(ADMIN_PROFILE)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('membership', () => {
    it('refuses a non-member listing the member roster', async () => {
      await expect(service.listMembers(COMPANY_ID, contextFor(OUTSIDER_PROFILE))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lets a member list the roster', async () => {
      const members = await service.listMembers(COMPANY_ID, contextFor(MEMBER_PROFILE));

      expect(members).toHaveLength(2);
    });

    it('refuses a plain member adding somebody', async () => {
      await expect(
        service.addMember(
          COMPANY_ID,
          { user_id: OUTSIDER_PROFILE, role: CompanyRole.Admin },
          contextFor(MEMBER_PROFILE),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects adding the same person twice', async () => {
      await expect(
        service.addMember(
          COMPANY_ID,
          { user_id: MEMBER_PROFILE, role: CompanyRole.Member },
          contextFor(ADMIN_PROFILE),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects adding a profile that does not exist', async () => {
      await expect(
        service.addMember(
          COMPANY_ID,
          { user_id: '99999999-9999-4999-8999-999999999999', role: CompanyRole.Member },
          contextFor(ADMIN_PROFILE),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('records a role change in the audit trail', async () => {
      await service.updateMemberRole(
        COMPANY_ID,
        MEMBER_PROFILE,
        { role: CompanyRole.Admin },
        contextFor(ADMIN_PROFILE),
      );

      const entry = supabase.rowsOf(Tables.AUDIT_LOGS).find((row) => row['action'] === 'ROLE_CHANGED');
      expect(entry).toBeDefined();
      expect(entry?.['actor_id']).toBe(ADMIN_PROFILE);
    });

    it('refuses to remove the last administrator', async () => {
      await expect(
        service.removeMember(COMPANY_ID, ADMIN_PROFILE, contextFor(ADMIN_PROFILE)),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets a member remove themselves', async () => {
      await service.removeMember(COMPANY_ID, MEMBER_PROFILE, contextFor(MEMBER_PROFILE));

      expect(
        supabase.rowsOf(Tables.COMPANY_MEMBERS).filter((row) => row['company_id'] === COMPANY_ID),
      ).toHaveLength(1);
    });

    it('refuses a member removing somebody else', async () => {
      await expect(
        service.removeMember(COMPANY_ID, ADMIN_PROFILE, contextFor(MEMBER_PROFILE)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      supabase.rpcHandlers.set('create_company_with_owner', (args) => {
        if (supabase.rowsOf(Tables.COMPANIES).some((row) => row['slug'] === args['p_slug'])) {
          return { data: null, error: { message: 'slug_taken', code: '23505' } };
        }
        const company = { id: 'company-new', name: args['p_name'], slug: args['p_slug'], status: 'active' };
        supabase.rowsOf(Tables.COMPANIES).push(company);
        supabase.rowsOf(Tables.COMPANY_MEMBERS).push({
          id: 'cm-new',
          company_id: 'company-new',
          user_id: args['p_owner_profile_id'],
          role: CompanyRole.Admin,
        });
        return { data: company, error: null };
      });
    });

    it('makes the creator an administrator of the new company', async () => {
      const context = contextFor(OUTSIDER_PROFILE);

      const company = await service.create(context, { name: 'New Venue', slug: 'new-venue' });

      expect(await service.isCompanyAdmin(company.id, context)).toBe(true);
    });

    it('rejects a duplicate slug', async () => {
      await expect(
        service.create(contextFor(OUTSIDER_PROFILE), {
          name: 'Clash',
          slug: 'harbour-table-group',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
