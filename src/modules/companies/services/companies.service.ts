import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database';
import { AuthTokens, MemberAuthService } from '../../identity';

/**
 * Company permissions (contracts/app `CompanyPermission`). ADR-030: the single Company
 * Account holds all of them; the server checks a permission, never the role name.
 */
export const COMPANY_PERMISSIONS = [
  'EDIT_PROFILE',
  'MANAGE_PROJECTS',
  'MANAGE_OPPORTUNITIES',
  'REVIEW_APPLICANTS',
  'RESPOND_TO_SUPPLIER_REQUESTS',
] as const;

/** contracts/app `CompanyMembership`. */
export interface CompanyMembershipView {
  company: {
    id: string;
    name: string;
    company_type: string;
    logo_url: string | null;
    is_verified: boolean;
    /** Who may create supplier requests is decided with Phase 5; none until then. */
    capabilities: string[];
  };
  role: 'OWNER';
  permissions: string[];
}

/**
 * Companies (ADR-030: one Company Account per company). Phase 2 creates the company at
 * registration and serves its summary; the profile arrives in Phase 3a.
 */
@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberAuth: MemberAuthService,
  ) {}

  /** contracts/app POST /auth/register for `account_type = COMPANY`: account and company in one transaction. */
  register(input: unknown): Promise<AuthTokens> {
    return this.memberAuth.register(input, async (tx, user, data) => {
      await tx.company.create({
        data: { accountUserId: user.id, name: data.company!.name, companyType: data.company!.company_type },
      });
    });
  }

  async companyIdFor(accountUserId: string): Promise<string | null> {
    const company = await this.prisma.company.findUnique({ where: { accountUserId }, select: { id: true } });
    return company?.id ?? null;
  }

  async membershipFor(accountUserId: string): Promise<CompanyMembershipView | null> {
    const company = await this.prisma.company.findUnique({ where: { accountUserId } });
    if (!company) return null;
    return {
      company: {
        id: company.id,
        name: company.name,
        company_type: company.companyType,
        logo_url: null,
        is_verified: company.verifiedAt !== null,
        capabilities: [],
      },
      role: 'OWNER',
      permissions: [...COMPANY_PERMISSIONS],
    };
  }
}
