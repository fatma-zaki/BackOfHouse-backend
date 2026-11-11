import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { normalizeArabic } from '../../../common/text';
import { daysBefore, riyadhDay } from '../../../common/time/riyadh';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import { AccountStatusService } from '../../identity';
import { requireFeaturePermission } from '../policies/featured.policy';

/** contracts/admin `CompanySummary.category` ↔ the company type. Types without a category show none. */
const CATEGORY_OF: Record<string, AdminCategory | undefined> = {
  EVENT_ORGANIZER: 'ORGANIZER',
  VENUE: 'VENUE',
  SUPPLIER: 'SUPPLIER',
  AGENCY: 'AGENCY',
  PRODUCTION: 'PRODUCTION',
};
const TYPE_OF: Record<AdminCategory, string> = {
  ORGANIZER: 'EVENT_ORGANIZER',
  VENUE: 'VENUE',
  SUPPLIER: 'SUPPLIER',
  AGENCY: 'AGENCY',
  PRODUCTION: 'PRODUCTION',
};
const CATEGORIES = ['ORGANIZER', 'VENUE', 'SUPPLIER', 'AGENCY', 'PRODUCTION'] as const;
type AdminCategory = (typeof CATEGORIES)[number];

const SORTS = { created_at: 'createdAt', name: 'name', followers: 'followersCount' } as const;

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?(created_at|name|followers)$/, 'must be created_at, name or followers, optionally prefixed with -')
    .optional(),
  q: z.string().trim().max(100).optional(),
  verification: z.enum(['NONE', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'UNCLAIMED']).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
});

const updateSchema = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    city: z.string().trim().max(100).optional(),
    featured_to_watch: z.boolean().optional(),
    featured_order: z.number().int().min(1).max(1000).nullable().optional(),
  })
  .strict();

const reasonSchema = z
  .object({ reason: z.string({ error: 'is required' }).trim().min(1, 'is required').max(2000) })
  .strict();

/** contracts/admin `CompanyAdmin`. Opportunity figures fill in with Phase 5. */
export interface CompanyAdminView {
  id: string;
  slug: string;
  name: string;
  category: AdminCategory | null;
  industry: string | null;
  city: string | null;
  verified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  verification: 'NONE' | 'VERIFIED';
  verifiedAt: Date | null;
  verifiedBy: string | null;
  featuredToWatch: boolean;
  featuredOrder: number | null;
  followers: number;
  teamSize: number;
  source: 'SIGNUP' | 'IMPORT';
  createdAt: Date;
}

export interface Kpi {
  key: string;
  label: string;
  value: number;
  display: string;
}

const withAccount = {
  accountUser: { select: { status: true } },
  verifiedBy: { select: { name: true } },
} as const;

type CompanyRow = Prisma.CompanyGetPayload<{ include: typeof withAccount }>;

/**
 * Companies in the back office (contracts/admin /companies*). Featuring goes through
 * featured.policy.ts (Super admin only); suspending suspends the Company Account, which
 * hides the company from the directory (and its opportunities, Phase 5).
 */
@Injectable()
export class CompaniesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly accounts: AccountStatusService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(
    actor: Actor | undefined,
    input: unknown,
  ): Promise<{ items: CompanyAdminView[]; total: number; kpis: Kpi[] }> {
    this.requireStaff(actor, 'companies.view');
    const query = parseInput(listSchema, input);
    const and: Prisma.CompanyWhereInput[] = [];
    if (query.q) and.push({ nameNormalized: { contains: normalizeArabic(query.q) } });
    if (query.verification === 'VERIFIED') and.push({ verifiedAt: { not: null } });
    if (query.verification === 'NONE') and.push({ verifiedAt: null });
    // Company verification requests arrive with company signals; nothing is PENDING or REJECTED yet.
    if (query.verification === 'PENDING' || query.verification === 'REJECTED') and.push({ id: { in: [] } });
    if (query.status === 'ACTIVE' || query.status === 'SUSPENDED') and.push({ accountUser: { status: query.status } });
    if (query.status === 'UNCLAIMED') and.push({ id: { in: [] } });
    if (query.city) and.push({ city: { equals: query.city, mode: 'insensitive' } });
    if (query.category) and.push({ companyType: TYPE_OF[query.category] as never });
    const where: Prisma.CompanyWhereInput = { AND: and };
    const sort = query.sort ?? '-created_at';
    const field = SORTS[sort.replace('-', '') as keyof typeof SORTS];
    const [rows, total, all, verified, suspended, featured] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: withAccount,
        orderBy: [{ [field]: sort.startsWith('-') ? 'desc' : 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.company.count({ where }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { verifiedAt: { not: null } } }),
      this.prisma.company.count({ where: { accountUser: { status: 'SUSPENDED' } } }),
      this.prisma.company.count({ where: { editorsPick: true } }),
    ]);
    return {
      items: rows.map((row) => this.view(row)),
      total,
      kpis: [
        kpi('companies', 'Companies', all),
        kpi('verified', 'Verified', verified),
        kpi('suspended', 'Suspended', suspended),
        kpi('featured_to_watch', 'Companies to Watch', featured),
      ],
    };
  }

  async detail(
    actor: Actor | undefined,
    companyId: string,
  ): Promise<{ company: CompanyAdminView; kpis: Kpi[]; allowedActions: string[] }> {
    const staff = this.requireStaff(actor, 'companies.view');
    const company = this.view(await this.find(companyId));
    const today = riyadhDay(this.clock.now());
    const [projects, views] = await Promise.all([
      this.prisma.companyProject.count({ where: { companyId } }),
      this.prisma.companyProfileView.count({ where: { companyId, day: { gte: new Date(daysBefore(today, 29)) } } }),
    ]);
    const allowed: string[] = [];
    if (staffHas(staff, 'companies.edit')) allowed.push('EDIT');
    if (staffHas(staff, 'companies.feature')) allowed.push('FEATURE');
    if (staffHas(staff, 'accounts.suspend') && company.status === 'ACTIVE') allowed.push('SUSPEND');
    if (staffHas(staff, 'verification.decide') && company.verified) allowed.push('REMOVE_VERIFICATION');
    return {
      company,
      kpis: [
        kpi('followers', 'Followers', company.followers),
        kpi('projects', 'Portfolio projects', projects),
        kpi('profile_views_30d', 'Profile views, 30 days', views),
      ],
      allowedActions: allowed,
    };
  }

  /** Category and city need `companies.edit`; featuring also needs `companies.feature`. */
  async update(actor: Actor | undefined, companyId: string, input: unknown): Promise<CompanyAdminView> {
    const staff = this.requireStaff(actor, 'companies.edit');
    const data = parseInput(updateSchema, input);
    const before = await this.find(companyId);
    if (data.featured_to_watch !== undefined || data.featured_order !== undefined) {
      await this.setFeatured(staff, companyId, {
        featured: data.featured_to_watch ?? before.editorsPick,
        order: data.featured_order === undefined ? before.featuredOrder : data.featured_order,
      });
    }
    if (data.category !== undefined || data.city !== undefined) {
      await this.transactions.run(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: {
            ...(data.category ? { companyType: TYPE_OF[data.category] as never } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
          },
        });
        await this.audit.record({
          actor: auditActorOf(staff),
          action: 'company.update',
          entityType: 'company',
          entityId: companyId,
          changes: {
            before: { company_type: before.companyType, city: before.city },
            after: {
              company_type: data.category ? TYPE_OF[data.category] : before.companyType,
              city: data.city ?? before.city,
            },
          },
        });
      });
    }
    return this.view(await this.find(companyId));
  }

  /**
   * "Companies to Watch" (editorial, free). The only writer of `editors_pick` and
   * `featured_order`; featured.policy.ts refuses anyone but a Super admin.
   */
  async setFeatured(
    actor: Actor | undefined,
    companyId: string,
    input: { featured: boolean; order: number | null },
  ): Promise<void> {
    const staff = requireFeaturePermission(actor);
    await this.find(companyId);
    await this.transactions.run(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: { editorsPick: input.featured, featuredOrder: input.featured ? input.order : null },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'company.feature',
        entityType: 'company',
        entityId: companyId,
        changes: { after: { featured_to_watch: input.featured, featured_order: input.featured ? input.order : null } },
      });
    });
  }

  /** Suspends the Company Account (`accounts.suspend`); the company leaves the directory. */
  async suspend(actor: Actor | undefined, companyId: string, input: unknown): Promise<CompanyAdminView> {
    this.requireStaff(actor, 'accounts.suspend');
    const company = await this.find(companyId);
    await this.accounts.suspend(actor, company.accountUserId, input);
    return this.view(await this.find(companyId));
  }

  /** The company's people: the single Company Account (ADR-030, P3). */
  async team(actor: Actor | undefined, companyId: string): Promise<{ userId: string; role: 'OWNER' }[]> {
    this.requireStaff(actor, 'companies.view');
    const company = await this.find(companyId);
    return [{ userId: company.accountUserId, role: 'OWNER' }];
  }

  async removeVerification(actor: Actor | undefined, companyId: string, input: unknown): Promise<CompanyAdminView> {
    const staff = this.requireStaff(actor, 'verification.decide');
    const { reason } = parseInput(reasonSchema, input);
    const company = await this.find(companyId);
    if (!company.verifiedAt) {
      throw new DomainError(ErrorCode.INVALID_TRANSITION, 'This company is not verified', HttpStatus.CONFLICT);
    }
    await this.transactions.run(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { verifiedAt: null, verifiedByStaffId: null } });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'company.verification.remove',
        entityType: 'company',
        entityId: companyId,
        changes: { before: { verified: true }, after: { verified: false, reason } },
      });
      await this.outbox.emit({
        name: 'organization.verification_removed',
        aggregateType: 'company',
        aggregateId: companyId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { organization_id: companyId },
      });
    });
    return this.view(await this.find(companyId));
  }

  private async find(companyId: string): Promise<CompanyRow> {
    const company = z.string().uuid().safeParse(companyId).success
      ? await this.prisma.company.findUnique({ where: { id: companyId }, include: withAccount })
      : null;
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  private view(row: CompanyRow): CompanyAdminView {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: CATEGORY_OF[row.companyType] ?? null,
      industry: row.industries?.[0] ?? null,
      city: row.city || null,
      verified: row.verifiedAt !== null,
      status: row.accountUser.status,
      verification: row.verifiedAt ? 'VERIFIED' : 'NONE',
      verifiedAt: row.verifiedAt,
      verifiedBy: row.verifiedBy?.name ?? null,
      featuredToWatch: row.editorsPick,
      featuredOrder: row.featuredOrder,
      followers: row.followersCount,
      teamSize: 1,
      source: row.source,
      createdAt: row.createdAt,
    };
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

function kpi(key: string, label: string, value: number): Kpi {
  return { key, label, value, display: value.toLocaleString('en') };
}
