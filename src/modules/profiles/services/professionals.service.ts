import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, requireMember } from '../../../common/context/actor';
import { NotFoundError, ValidationFailedError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { normalizeArabic } from '../../../common/text';
import { escapeLike, parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../platform/database';

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
  verified: boolean;
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
  connected: boolean;
}

/**
 * The professionals directory for individuals (contracts/app /professionals*): active
 * individuals other than the viewer, by name in the request language. Search matches the
 * normalised name and headline. A connection is one-sided until BQ-85 decides acceptance.
 */
@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const rows = await this.rows(viewer.userId, conditions, {
      orderBy: Prisma.sql`ORDER BY u.full_name COLLATE ${COLLATION[locale]}, u.id`,
      limit: query.page_size + 1,
      offset: (query.page - 1) * query.page_size,
    });
    return { items: rows.slice(0, query.page_size).map(toView), hasMore: rows.length > query.page_size };
  }

  /** Idempotent (PUT). Connecting to yourself is refused. */
  async connect(actor: Actor | undefined, targetId: string): Promise<ProfessionalView> {
    const viewer = requireMember(actor);
    if (targetId === viewer.userId) throw new ValidationFailedError({ id: ['You cannot connect to yourself'] });
    await this.requireProfessional(viewer.userId, targetId);
    await this.prisma.professionalConnection.createMany({
      data: [{ requesterUserId: viewer.userId, targetUserId: targetId }],
      skipDuplicates: true,
    });
    return this.one(viewer.userId, targetId);
  }

  /** Idempotent (DELETE). */
  async disconnect(actor: Actor | undefined, targetId: string): Promise<ProfessionalView> {
    const viewer = requireMember(actor);
    await this.requireProfessional(viewer.userId, targetId);
    await this.prisma.professionalConnection.deleteMany({
      where: { requesterUserId: viewer.userId, targetUserId: targetId },
    });
    return this.one(viewer.userId, targetId);
  }

  private async requireProfessional(viewerId: string, targetId: string): Promise<void> {
    if (!z.string().uuid().safeParse(targetId).success || targetId === viewerId) {
      throw new NotFoundError('Professional not found');
    }
    const found = await this.prisma.user.count({
      where: { id: targetId, accountType: 'INDIVIDUAL', status: 'ACTIVE' },
    });
    if (found === 0) throw new NotFoundError('Professional not found');
  }

  private async one(viewerId: string, targetId: string): Promise<ProfessionalView> {
    const [row] = await this.rows(viewerId, [Prisma.sql`u.id = ${targetId}::uuid`], {
      orderBy: Prisma.empty,
      limit: 1,
      offset: 0,
    });
    if (!row) throw new NotFoundError('Professional not found');
    return toView(row);
  }

  private rows(
    viewerId: string,
    conditions: Prisma.Sql[],
    page: { orderBy: Prisma.Sql; limit: number; offset: number },
  ): Promise<Row[]> {
    return this.prisma.$queryRaw<Row[]>`
      SELECT u.id, u.full_name, u.profile_status::text AS profile_status,
             p.headline, p.current_company, p.city,
             p.availability::text AS availability, p.professional_field::text AS professional_field,
             EXISTS (
               SELECT 1 FROM app.professional_connections c
               WHERE c.requester_user_id = ${viewerId}::uuid AND c.target_user_id = u.id
             ) AS connected
      FROM app.users u
      LEFT JOIN app.profiles p ON p.user_id = u.id
      WHERE u.account_type = 'INDIVIDUAL' AND u.status = 'ACTIVE' AND ${Prisma.join(conditions, ' AND ')}
      ${page.orderBy}
      LIMIT ${page.limit} OFFSET ${page.offset}
    `;
  }
}

function toView(row: Row): ProfessionalView {
  return {
    id: row.id,
    name: row.full_name,
    role: row.headline ?? '',
    company: row.current_company ?? '',
    city: row.city ?? '',
    // Experience entries have no editing route yet (BQ-85).
    yearsExperience: 0,
    skills: [],
    availability: row.availability ?? 'AVAILABLE',
    verified: false,
    connected: row.connected,
    field: row.professional_field ?? 'OTHER',
    student: row.profile_status === 'STUDENT',
    highlighted: false,
  };
}
