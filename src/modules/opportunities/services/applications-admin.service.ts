import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { ForbiddenError, NotFoundError } from '../../../common/errors';
import { isUuid } from '../../../common/ids/uuid-v7';
import { decodeCursor, encodeCursor } from '../../../common/pagination';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../platform/database';
import { CompaniesService, CompanyCard } from '../../companies';
import type { ApplicationStatus } from '../domain/application-status.policy';
import { OPPORTUNITY_TYPES } from '../domain/opportunity-type.policy';
import { applicationInclude, ApplicationRow, ApplicationView, applicationView } from './application-views';

/**
 * contracts/admin `ApplicationAdmin.status` names the stages differently from the app.
 * CONTACT has no admin name and reads as SHORTLISTED; `stage` carries the app status.
 */
export const ADMIN_APPLICATION_STATUS: Record<ApplicationStatus, AdminApplicationStatus> = {
  SUBMITTED: 'APPLIED',
  REVIEWED: 'IN_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  CONTACT: 'SHORTLISTED',
  ACCEPTED: 'SELECTED',
  REJECTED: 'NOT_SELECTED',
  WITHDRAWN: 'WITHDRAWN',
};

export const ADMIN_APPLICATION_STATUSES = [
  'APPLIED',
  'IN_REVIEW',
  'SHORTLISTED',
  'SELECTED',
  'NOT_SELECTED',
  'WITHDRAWN',
] as const;

export type AdminApplicationStatus = (typeof ADMIN_APPLICATION_STATUSES)[number];

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-11-01');

const SORTS = { created_at: 'createdAt', updated_at: 'updatedAt' } as const;

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?(created_at|updated_at)$/, 'must be created_at or updated_at, optionally prefixed with -')
    .optional(),
  q: z.string().trim().max(100).optional(),
  from: date.optional(),
  to: date.optional(),
  status: z.enum(ADMIN_APPLICATION_STATUSES).optional(),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  company_id: z.string().uuid().optional(),
  city: z.string().trim().max(100).optional(),
});

const cursorSchema = z.object({ cursor: z.string().max(512).optional(), limit: z.number().int().min(1).max(50) });
const CURSOR_KEYS = ['created_at', 'id'] as const;
const DAY_MS = 86_400_000;

/** contracts/admin `ApplicationAdmin`, before presentation. */
export interface ApplicationAdminView extends ApplicationView {
  company: CompanyCard;
  /** Whole days since the status last changed; null once final. */
  timeInStageDays: number | null;
  createdAt: Date;
}

/**
 * Applications in the back office (contracts/admin GET /applications, GET
 * /users/{id}/applications). Read-only: companies own the decision, and no staff role
 * changes an application's status (test/architecture/admin-contract.spec.ts).
 */
@Injectable()
export class ApplicationsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** GET /applications (`applications.view`), newest first by default. */
  async list(actor: Actor | undefined, input: unknown): Promise<{ items: ApplicationAdminView[]; total: number }> {
    this.requireStaff(actor, 'applications.view');
    const query = parseInput(listSchema, input);
    const and: Prisma.ApplicationWhereInput[] = [];
    if (query.status) {
      const statuses = (Object.keys(ADMIN_APPLICATION_STATUS) as ApplicationStatus[]).filter(
        (s) => ADMIN_APPLICATION_STATUS[s] === query.status,
      );
      and.push({ status: { in: statuses } });
    }
    if (query.type) and.push({ opportunity: { type: query.type } });
    if (query.company_id) and.push({ opportunity: { companyId: query.company_id } });
    if (query.city) and.push({ opportunity: { city: { equals: query.city, mode: 'insensitive' } } });
    if (query.from) and.push({ createdAt: { gte: new Date(`${query.from}T00:00:00+03:00`) } });
    if (query.to) {
      and.push({ createdAt: { lt: new Date(new Date(`${query.to}T00:00:00+03:00`).getTime() + DAY_MS) } });
    }
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({ OR: [{ opportunity: { title: like } }, { applicantUser: { fullName: like } }] });
    }
    const where: Prisma.ApplicationWhereInput = { AND: and };
    const sort = query.sort ?? '-created_at';
    const field = SORTS[sort.replace(/^-/, '') as keyof typeof SORTS];
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: applicationInclude,
        orderBy: [{ [field]: direction }, { id: direction }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.application.count({ where }),
    ]);
    return { items: await this.views(rows), total };
  }

  /** GET /users/{id}/applications (`users.view`), newest first, by cursor. */
  async ofUser(
    actor: Actor | undefined,
    userId: string,
    input: unknown,
  ): Promise<{ items: ApplicationAdminView[]; nextCursor: string | null }> {
    this.requireStaff(actor, 'users.view');
    const query = parseInput(cursorSchema, input);
    if (!isUuid(userId) || (await this.prisma.user.count({ where: { id: userId } })) === 0) {
      throw new NotFoundError('User not found');
    }
    const after = query.cursor ? decodeCursor(query.cursor, CURSOR_KEYS) : null;
    const rows = await this.prisma.application.findMany({
      where: {
        applicantUserId: userId,
        ...(after
          ? {
              OR: [
                { createdAt: { lt: new Date(String(after.created_at)) } },
                { createdAt: new Date(String(after.created_at)), id: { lt: String(after.id) } },
              ],
            }
          : {}),
      },
      include: applicationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const page = rows.slice(0, query.limit);
    const last = rows.length > query.limit ? page[page.length - 1] : null;
    return {
      items: await this.views(page),
      nextCursor: last ? encodeCursor({ created_at: last.createdAt.toISOString(), id: last.id }) : null,
    };
  }

  private async views(rows: ApplicationRow[]): Promise<ApplicationAdminView[]> {
    if (rows.length === 0) return [];
    const cards = await this.companies.cards(rows.map((r) => r.opportunity.companyId));
    const now = this.clock.now().getTime();
    return rows.map((row) => ({
      ...applicationView(row),
      company: cards.get(row.opportunity.companyId)!,
      timeInStageDays: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(row.status)
        ? null
        : Math.floor((now - row.statusChangedAt.getTime()) / DAY_MS),
      createdAt: row.createdAt,
    }));
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}
