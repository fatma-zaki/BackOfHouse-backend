import { Injectable } from '@nestjs/common';
import { uuidv7 } from '../../../common/ids/uuid-v7';
import { normalizeArabic } from '../../../common/text';
import { PrismaService } from '../../../platform/database';
import { AuthTokens, MemberAuthService } from '../../identity';
import { companySlug } from '../domain/slug';
import { COMPANY_PERMISSIONS, companyCapabilities } from '../policies/company-actor.policy';
import { CompanyProjectView, projectView } from './company-views';

/** contracts/app `CompanyMembership`. */
export interface CompanyMembershipView {
  company: {
    id: string;
    name: string;
    company_type: string;
    logo_url: string | null;
    is_verified: boolean;
    /** contracts/app `CompanyCapability` (BQ-83: verified companies create supplier requests). */
    capabilities: string[];
  };
  role: 'OWNER';
  permissions: string[];
}

/** A company as listings show it (contracts/app and admin `CompanySummary`). */
export interface CompanyCard {
  id: string;
  slug: string;
  name: string;
  companyType: string;
  city: string;
  isVerified: boolean;
  capabilities: string[];
  accountUserId: string;
  /** Its Company Account is active, so it is listed and its listings are visible. */
  active: boolean;
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

  /** For news checks: the company exists and its Company Account is active (it is listed). */
  async isLive(companyId: string): Promise<boolean> {
    if (!/^[0-9a-f-]{36}$/i.test(companyId)) return false;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { accountUser: { select: { status: true } } },
    });
    return company?.accountUser.status === 'ACTIVE';
  }

  /**
   * For news checks: names of listed companies that appear in the text (case-insensitive,
   * names of at least 4 characters so short words do not match), at most `limit`.
   */
  async namedIn(text: string, limit = 5): Promise<string[]> {
    if (!text.trim()) return [];
    const rows = await this.prisma.$queryRaw<{ name: string }[]>`
      SELECT c.name
      FROM app.companies c
      JOIN app.users u ON u.id = c.account_user_id
      WHERE u.status = 'ACTIVE'
        AND char_length(btrim(c.name)) >= 4
        AND strpos(lower(${text}), lower(btrim(c.name))) > 0
      ORDER BY c.name
      LIMIT ${limit}
    `;
    return rows.map((r) => r.name);
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

  /** Listing cards for these companies, by id (missing ids are left out). */
  async cards(companyIds: string[]): Promise<Map<string, CompanyCard>> {
    const ids = [...new Set(companyIds)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.company.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slug: true,
        name: true,
        companyType: true,
        city: true,
        verifiedAt: true,
        accountUserId: true,
        accountUser: { select: { status: true } },
      },
    });
    return new Map(
      rows.map((c) => [
        c.id,
        {
          id: c.id,
          slug: c.slug,
          name: c.name,
          companyType: c.companyType,
          city: c.city,
          isVerified: c.verifiedAt !== null,
          capabilities: companyCapabilities(c.verifiedAt !== null),
          accountUserId: c.accountUserId,
          active: c.accountUser.status === 'ACTIVE',
        },
      ]),
    );
  }

  /**
   * The company's own projects among `ids`, in the order given (evidence on a supplier
   * response). Ids of another company's projects are left out; the caller compares counts.
   */
  async ownProjects(companyId: string, ids: readonly string[]): Promise<CompanyProjectView[]> {
    const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (valid.length === 0) return [];
    const rows = await this.prisma.companyProject.findMany({ where: { companyId, id: { in: valid } } });
    const byId = new Map(rows.map((r) => [r.id, projectView(r)]));
    return valid.map((id) => byId.get(id)).filter((p): p is CompanyProjectView => p !== undefined);
  }

  /** Members following the company whose accounts are active (for "new listing" alerts). */
  async followerIds(companyId: string): Promise<string[]> {
    const rows = await this.prisma.companyFollow.findMany({
      where: { companyId, user: { status: 'ACTIVE' } },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.userId);
  }

  async card(companyId: string): Promise<CompanyCard | null> {
    return (await this.cards([companyId])).get(companyId) ?? null;
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
        capabilities: companyCapabilities(company.verifiedAt !== null),
      },
      role: 'OWNER',
      permissions: [...COMPANY_PERMISSIONS],
    };
  }
}
