import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember } from '../../../common/context/actor';
import { NotFoundError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { normalizeArabic } from '../../../common/text';
import { riyadhDay } from '../../../common/time/riyadh';
import { escapeLike, parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { CompanyProjectView, CompanyView, companyView, projectView } from './company-views';

const COMPANY_TYPES = [
  'EVENT_ORGANIZER',
  'SUPPLIER',
  'VENUE',
  'PRODUCTION',
  'AGENCY',
  'SERVICE_PROVIDER',
  'OTHER',
] as const;

const listSchema = z.object({
  type: z.enum(COMPANY_TYPES).optional(),
  editors_pick: z.boolean().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

export type CompanyListQuery = z.input<typeof listSchema>;

/** ICU collation per answer language (execution-plan.md Phase 3a: Arabic A–Z). */
export const NAME_COLLATION: Record<Locale, Prisma.Sql> = {
  ar: Prisma.raw('"ar-x-icu"'),
  en: Prisma.raw('"en-x-icu"'),
};

/**
 * The company directory for individuals (contracts/app /companies*). Lists every company
 * whose Company Account is ACTIVE (BQ-86), sorted by name in the request language.
 * Search matches the normalised name, so أحمد, احمد and إحمد find the same company.
 */
@Injectable()
export class CompanyDirectoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** One page plus whether more exist (`page_size + 1` rows are read). */
  async list(
    actor: Actor | undefined,
    input: CompanyListQuery,
    locale: Locale,
  ): Promise<{ items: CompanyView[]; hasMore: boolean }> {
    const viewer = requireMember(actor);
    const query = parseInput(listSchema, input);
    const conditions = [Prisma.sql`u.status = 'ACTIVE'`];
    if (query.type) conditions.push(Prisma.sql`c.company_type = ${query.type}::app.company_type`);
    if (query.editors_pick) conditions.push(Prisma.sql`c.editors_pick`);
    const term = query.q ? normalizeArabic(query.q) : '';
    if (term) conditions.push(Prisma.sql`c.name_normalized LIKE ${`%${escapeLike(term)}%`} ESCAPE '\\'`);

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id FROM app.companies c
      JOIN app.users u ON u.id = c.account_user_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY c.name COLLATE ${NAME_COLLATION[locale]}, c.id
      LIMIT ${query.page_size + 1} OFFSET ${(query.page - 1) * query.page_size}
    `;
    const ids = rows.slice(0, query.page_size).map((row) => row.id);
    return { items: await this.views(ids, viewer.userId), hasMore: rows.length > query.page_size };
  }

  /** A company's public profile; opening it counts one view per viewer per Riyadh day. */
  async get(actor: Actor | undefined, companyId: string): Promise<CompanyView> {
    const viewer = requireMember(actor);
    await this.requireVisible(companyId);
    await this.prisma.companyProfileView.createMany({
      data: [{ companyId, viewerUserId: viewer.userId, day: new Date(riyadhDay(this.clock.now())) }],
      skipDuplicates: true,
    });
    return (await this.views([companyId], viewer.userId))[0];
  }

  /** Idempotent (PUT): `followers` moves only when the follow is new. */
  async follow(actor: Actor | undefined, companyId: string): Promise<CompanyView> {
    const viewer = requireMember(actor);
    await this.requireVisible(companyId);
    await this.transactions.run(async (tx) => {
      const { count } = await tx.companyFollow.createMany({
        data: [{ userId: viewer.userId, companyId }],
        skipDuplicates: true,
      });
      if (count > 0) await tx.company.update({ where: { id: companyId }, data: { followersCount: { increment: 1 } } });
    });
    return (await this.views([companyId], viewer.userId))[0];
  }

  /** Idempotent (DELETE): `followers` moves only when a follow existed. */
  async unfollow(actor: Actor | undefined, companyId: string): Promise<CompanyView> {
    const viewer = requireMember(actor);
    await this.requireVisible(companyId);
    await this.transactions.run(async (tx) => {
      const { count } = await tx.companyFollow.deleteMany({ where: { userId: viewer.userId, companyId } });
      if (count > 0) await tx.company.update({ where: { id: companyId }, data: { followersCount: { decrement: 1 } } });
    });
    return (await this.views([companyId], viewer.userId))[0];
  }

  /** The public portfolio, newest first. */
  async projects(actor: Actor | undefined, companyId: string): Promise<CompanyProjectView[]> {
    requireMember(actor);
    await this.requireVisible(companyId);
    const projects = await this.prisma.companyProject.findMany({
      where: { companyId },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    return projects.map(projectView);
  }

  private async requireVisible(companyId: string): Promise<void> {
    if (!z.string().uuid().safeParse(companyId).success) throw new NotFoundError('Company not found');
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { accountUser: { select: { status: true } } },
    });
    if (company?.accountUser.status !== 'ACTIVE') throw new NotFoundError('Company not found');
  }

  /** Full views in the order of `ids`. */
  private async views(ids: string[], viewerUserId: string): Promise<CompanyView[]> {
    if (ids.length === 0) return [];
    const [companies, projectCounts, follows] = await Promise.all([
      this.prisma.company.findMany({ where: { id: { in: ids } } }),
      this.prisma.companyProject.groupBy({ by: ['companyId'], where: { companyId: { in: ids } }, _count: true }),
      this.prisma.companyFollow.findMany({
        where: { userId: viewerUserId, companyId: { in: ids } },
        select: { companyId: true },
      }),
    ]);
    const followed = new Set(follows.map((f) => f.companyId));
    const projects = new Map(projectCounts.map((p) => [p.companyId, p._count]));
    const byId = new Map(companies.map((c) => [c.id, c]));
    return ids.map((id) => companyView(byId.get(id)!, { projects: projects.get(id) ?? 0, followed: followed.has(id) }));
  }
}
