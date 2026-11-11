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
import { PrismaService } from '../../../platform/database';
import { currentCompany, ExperienceSpan, yearsOfExperience } from '../domain/experience';

const FILTERS = {
  PRODUCERS: Prisma.sql`p.professional_field = 'PRODUCTION'`,
  DESIGNERS: Prisma.sql`p.professional_field = 'DESIGN'`,
  TECHNICAL: Prisma.sql`p.professional_field = 'TECHNICAL'`,
  STUDENTS: Prisma.sql`u.profile_status = 'STUDENT'`,
} as const;

const listSchema = z.object({
  filter: z.enum(['PRODUCERS', 'DESIGNERS', 'TECHNICAL', 'STUDENTS']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

export type ProfessionalListQuery = z.input<typeof listSchema>;

const COLLATION: Record<Locale, Prisma.Sql> = { ar: Prisma.raw('"ar-x-icu"'), en: Prisma.raw('"en-x-icu"') };

/** A directory card (contracts/app `Professional`). Never carries email or phone. */
export interface ProfessionalView {
  id: string;
  name: string;
  role: string;
  company: string;
  city: string;
  yearsExperience: number;
  skills: string[];
  availability: 'AVAILABLE' | 'IN_PRODUCTION' | 'FULLY_BOOKED';
  /** Always false: connections are not offered (2026-11-10). */
  connected: boolean;
  field: 'PRODUCTION' | 'DESIGN' | 'TECHNICAL' | 'OTHER';
  student: boolean;
  /** Profile Highlight (a points reward, BQ-71) arrives with rewards in Phase 6. */
  highlighted: boolean;
}

interface Row {
  id: string;
  full_name: string;
  profile_status: string | null;
  headline: string | null;
  current_company: string | null;
  city: string | null;
  availability: ProfessionalView['availability'] | null;
  professional_field: ProfessionalView['field'] | null;
}

/**
 * The professionals directory for individuals (contracts/app /professionals*): active
 * individuals other than the viewer, by name in the request language. Search matches the
 * normalised name and headline. Years of experience and the current company come from the
 * members' experience entries. Connections are not offered (2026-11-10): the deprecated
 * v1 routes change nothing and answer `connected: false`.
 */
@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(
    actor: Actor | undefined,
    input: ProfessionalListQuery,
    locale: Locale,
  ): Promise<{ items: ProfessionalView[]; hasMore: boolean }> {
    const viewer = requireMember(actor);
    const query = parseInput(listSchema, input);
    const conditions = [Prisma.sql`u.id <> ${viewer.userId}::uuid`];
    if (query.filter) conditions.push(FILTERS[query.filter]);
    const term = query.q ? normalizeArabic(query.q) : '';
    if (term) {
      const pattern = `%${escapeLike(term)}%`;
      conditions.push(
        Prisma.sql`(u.full_name_normalized LIKE ${pattern} ESCAPE '\\' OR app.normalize_ar(coalesce(p.headline, '')) LIKE ${pattern} ESCAPE '\\')`,
      );
    }
    const rows = await this.rows(conditions, {
      orderBy: Prisma.sql`ORDER BY u.full_name COLLATE ${COLLATION[locale]}, u.id`,
      limit: query.page_size + 1,
      offset: (query.page - 1) * query.page_size,
    });
    return { items: await this.views(rows.slice(0, query.page_size)), hasMore: rows.length > query.page_size };
  }

  /** Deprecated (connections are not offered): the professional, unchanged. */
  async connect(actor: Actor | undefined, targetId: string): Promise<ProfessionalView> {
    return this.one(requireMember(actor).userId, targetId);
  }

  /** Deprecated (connections are not offered): the professional, unchanged. */
  async disconnect(actor: Actor | undefined, targetId: string): Promise<ProfessionalView> {
    return this.one(requireMember(actor).userId, targetId);
  }

  /** Another active individual, or 404 (the viewer is not in their own directory). */
  private async one(viewerId: string, targetId: string): Promise<ProfessionalView> {
    if (!z.string().uuid().safeParse(targetId).success || targetId === viewerId) {
      throw new NotFoundError('Professional not found');
    }
    const rows = await this.rows([Prisma.sql`u.id = ${targetId}::uuid`], {
      orderBy: Prisma.empty,
      limit: 1,
      offset: 0,
    });
    if (rows.length === 0) throw new NotFoundError('Professional not found');
    return (await this.views(rows))[0];
  }

  private rows(conditions: Prisma.Sql[], page: { orderBy: Prisma.Sql; limit: number; offset: number }): Promise<Row[]> {
    return this.prisma.$queryRaw<Row[]>`
      SELECT u.id, u.full_name, u.profile_status::text AS profile_status,
             p.headline, p.current_company, p.city,
             p.availability::text AS availability, p.professional_field::text AS professional_field
      FROM app.users u
      LEFT JOIN app.profiles p ON p.user_id = u.id
      WHERE u.account_type = 'INDIVIDUAL' AND u.status = 'ACTIVE' AND ${Prisma.join(conditions, ' AND ')}
      ${page.orderBy}
      LIMIT ${page.limit} OFFSET ${page.offset}
    `;
  }

  /** Cards in the order of `rows`, with experience and skills read in one query each. */
  private async views(rows: Row[]): Promise<ProfessionalView[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const entries = await this.prisma.profileExperience.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, company: true, startDate: true, endDate: true },
    });
    const today = riyadhDay(this.clock.now());
    const byUser = new Map<string, ExperienceSpan[]>();
    for (const e of entries) {
      const list = byUser.get(e.userId) ?? [];
      list.push({ company: e.company, start: isoDate(e.startDate), end: e.endDate ? isoDate(e.endDate) : null });
      byUser.set(e.userId, list);
    }
    return rows.map((row) => {
      const experience = byUser.get(row.id) ?? [];
      return {
        id: row.id,
        name: row.full_name,
        role: row.headline ?? '',
        company: row.current_company ?? currentCompany(experience) ?? '',
        city: row.city ?? '',
        yearsExperience: yearsOfExperience(experience, today),
        skills: [],
        availability: row.availability ?? 'AVAILABLE',
        connected: false,
        field: row.professional_field ?? 'OTHER',
        student: row.profile_status === 'STUDENT',
        highlighted: false,
      };
    });
  }
}

const isoDate = (value: Date) => value.toISOString().slice(0, 10);
