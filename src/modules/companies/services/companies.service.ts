import { Injectable } from '@nestjs/common';
import { uuidv7 } from '../../../common/ids/uuid-v7';
import { normalizeArabic } from '../../../common/text';
import { PrismaService } from '../../../platform/database';
import { AuthTokens, MemberAuthService } from '../../identity';
import { companySlug } from '../domain/slug';
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
      const id = uuidv7();
      await tx.company.create({
        data: {
          id,
          slug: companySlug(data.company!.name, id),
          accountUserId: user.id,
          name: data.company!.name,
          nameNormalized: normalizeArabic(data.company!.name),
          companyType: data.company!.company_type,
        },
      });
    });
  }

  /** For moderation: a company's name and the account answerable for it, or null. */
  async describe(companyId: string): Promise<{ title: string; ownerUserId: string; preview: string | null } | null> {
    if (!/^[0-9a-f-]{36}$/i.test(companyId)) return null;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, accountUserId: true, description: true },
    });
    return company
      ? { title: company.name, ownerUserId: company.accountUserId, preview: company.description || null }
      : null;
  }

  /** For moderation: a portfolio project's title and the Company Account that owns it, or null. */
  async describeProject(
    projectId: string,
  ): Promise<{ title: string; ownerUserId: string; preview: string | null } | null> {
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) return null;
    const project = await this.prisma.companyProject.findUnique({
      where: { id: projectId },
      select: { title: true, description: true, company: { select: { accountUserId: true } } },
    });
    return project
      ? { title: project.title, ownerUserId: project.company.accountUserId, preview: project.description.slice(0, 280) }
      : null;
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
