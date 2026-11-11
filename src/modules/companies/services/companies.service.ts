import { Injectable } from '@nestjs/common';
import { normalizeArabic } from '../../../common/text';
import { PrismaService } from '../../../platform/database';
import { AuthTokens, MemberAuthService } from '../../identity';
import { COMPANY_PERMISSIONS } from '../policies/company-actor.policy';

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
 * registration and serves its summary (the profile is in CompanyWorkspaceService).
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
        data: {
          accountUserId: user.id,
          name: data.company!.name,
          nameNormalized: normalizeArabic(data.company!.name),
          companyType: data.company!.company_type,
        },
      });
    });
  }

  /** Whether a company with this id exists (any status). */
  async exists(companyId: string): Promise<boolean> {
    if (!/^[0-9a-f-]{36}$/i.test(companyId)) return false;
    return (await this.prisma.company.count({ where: { id: companyId } })) > 0;
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
