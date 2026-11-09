import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import type { Actor } from '../../../common/context/actor';
import { NotFoundError } from '../../../common/errors';
import { daysBefore, riyadhDay } from '../../../common/time/riyadh';
import { parseInput } from '../../../common/validation/parse-input';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditActorType, AuditLogger } from '../../audit';
import { normalizePhone } from '../../identity';
import { requireCompanyActor } from '../policies/company-actor.policy';
import { CompanyProjectView, CompanyView, companyView, projectView } from './company-views';

const text = (max: number) => z.string().trim().max(max, `must be at most ${max} characters`);
const list = z
  .array(text(100).min(1, 'must not be empty'))
  .max(30, 'must have at most 30 items')
  .transform((items) => [...new Set(items)]);
/** Empty clears an optional field (contracts/app `CompanyProfileUpdate`). */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.literal('').transform(() => null), schema]).optional();

const profileSchema = z
  .object({
    specialization: text(120).optional(),
    city: text(100).optional(),
    description: text(1000).optional(),
    services: list.optional(),
    industries: list.optional(),
    contact_email: optional(
      z
        .string()
        .trim()
        .toLowerCase()
        .max(254)
        .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'must be empty or an email address'),
    ),
    contact_phone: optional(
      z.string().transform((value, ctx) => {
        const phone = normalizePhone(value);
        if (!phone) ctx.addIssue({ code: 'custom', message: 'must be empty or an international number' });
        return phone ?? '';
      }),
    ),
    website: optional(
      z
        .string()
        .trim()
        .max(300)
        .url('must be empty or a web address')
        .refine((value) => /^https?:\/\//i.test(value), 'must start with http:// or https://'),
    ),
  })
  .strict();

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-09-28')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'must be a real date');

const projectSchema = z
  .object({
    title: text(200).min(1, 'is required'),
    description: text(4000).min(1, 'is required'),
    location: text(200).min(1, 'is required'),
    category: text(100).min(1, 'is required'),
    started_at: date,
    ended_at: date.nullable().optional(),
    services: list.optional(),
    client_name: text(200).nullable().optional(),
  })
  .strict()
  .refine((p) => !p.ended_at || p.ended_at >= p.started_at, {
    path: ['ended_at'],
    message: 'must not be before started_at',
  });

export interface CompanyStatsView {
  liveListings: number;
  newApplicants: number;
  newApplicantsThisWeek: number;
  supplierInvites: number;
  profileViews: number;
  profileViewsChangePercent: number | null;
}

const VIEW_WINDOW_DAYS = 30;

/**
 * The Company Account's own workspace (contracts/app /company*). Every method takes the
 * company from the actor, so another company's project is simply not found (404).
 */
@Injectable()
export class CompanyWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async profile(actor: Actor | undefined): Promise<CompanyView> {
    const { companyId } = requireCompanyActor(actor);
    return this.view(companyId);
  }

  /** Name and type are the registered identity and are not editable here. */
  async updateProfile(actor: Actor | undefined, input: unknown): Promise<CompanyView> {
    const company = requireCompanyActor(actor, 'EDIT_PROFILE');
    const data = parseInput(profileSchema, input);
    await this.transactions.run(async (tx) => {
      await tx.company.update({
        where: { id: company.companyId },
        data: {
          specialization: data.specialization,
          city: data.city,
          description: data.description,
          services: data.services,
          industries: data.industries,
          contactEmail: data.contact_email,
          contactPhone: data.contact_phone,
          website: data.website,
        },
      });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId: company.userId },
        action: 'company.profile.update',
        entityType: 'company',
        entityId: company.companyId,
        changes: { after: { fields: Object.keys(data) } },
      });
    });
    return this.view(company.companyId);
  }

  /** Listing and applicant counts arrive with opportunities (Phase 5). */
  async stats(actor: Actor | undefined): Promise<CompanyStatsView> {
    const { companyId } = requireCompanyActor(actor);
    const today = riyadhDay(this.clock.now());
    const since = (days: number) => new Date(daysBefore(today, days));
    const [current, previous] = await Promise.all([
      this.prisma.companyProfileView.count({ where: { companyId, day: { gte: since(VIEW_WINDOW_DAYS - 1) } } }),
      this.prisma.companyProfileView.count({
        where: { companyId, day: { gte: since(2 * VIEW_WINDOW_DAYS - 1), lt: since(VIEW_WINDOW_DAYS - 1) } },
      }),
    ]);
    return {
      liveListings: 0,
      newApplicants: 0,
      newApplicantsThisWeek: 0,
      supplierInvites: 0,
      profileViews: current,
      profileViewsChangePercent: previous === 0 ? null : Math.round(((current - previous) * 100) / previous),
    };
  }

  async projects(actor: Actor | undefined): Promise<CompanyProjectView[]> {
    const { companyId } = requireCompanyActor(actor);
    const projects = await this.prisma.companyProject.findMany({
      where: { companyId },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    return projects.map(projectView);
  }

  async createProject(actor: Actor | undefined, input: unknown): Promise<CompanyProjectView> {
    const company = requireCompanyActor(actor, 'MANAGE_PROJECTS');
    const data = parseInput(projectSchema, input);
    const project = await this.transactions.run(async (tx) => {
      const created = await tx.companyProject.create({ data: { companyId: company.companyId, ...this.columns(data) } });
      await this.recordProject(company.userId, 'company.project.create', created.id);
      return created;
    });
    return projectView(project);
  }

  /** The whole project is sent (contracts/app `CompanyProjectInput`). */
  async updateProject(actor: Actor | undefined, projectId: string, input: unknown): Promise<CompanyProjectView> {
    const company = requireCompanyActor(actor, 'MANAGE_PROJECTS');
    await this.requireOwnProject(company.companyId, projectId);
    const data = parseInput(projectSchema, input);
    const project = await this.transactions.run(async (tx) => {
      const updated = await tx.companyProject.update({ where: { id: projectId }, data: this.columns(data) });
      await this.recordProject(company.userId, 'company.project.update', projectId);
      return updated;
    });
    return projectView(project);
  }

  async deleteProject(actor: Actor | undefined, projectId: string): Promise<void> {
    const company = requireCompanyActor(actor, 'MANAGE_PROJECTS');
    await this.requireOwnProject(company.companyId, projectId);
    await this.transactions.run(async (tx) => {
      await tx.companyProject.delete({ where: { id: projectId } });
      await this.recordProject(company.userId, 'company.project.delete', projectId);
    });
  }

  private columns(data: z.infer<typeof projectSchema>) {
    return {
      title: data.title,
      description: data.description,
      location: data.location,
      category: data.category,
      startedAt: new Date(`${data.started_at}T00:00:00Z`),
      endedAt: data.ended_at ? new Date(`${data.ended_at}T00:00:00Z`) : null,
      services: data.services ?? [],
      clientName: data.client_name || null,
    };
  }

  private async recordProject(userId: string, action: string, projectId: string): Promise<void> {
    await this.audit.record({
      actor: { type: AuditActorType.USER, userId },
      action,
      entityType: 'company_project',
      entityId: projectId,
    });
  }

  /** Another company's project answers 404, never 403, so ids do not leak. */
  private async requireOwnProject(companyId: string, projectId: string): Promise<void> {
    const found =
      z.string().uuid().safeParse(projectId).success &&
      (await this.prisma.companyProject.count({ where: { id: projectId, companyId } })) > 0;
    if (!found) throw new NotFoundError('Project not found');
  }

  private async view(companyId: string): Promise<CompanyView> {
    const [company, projects] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
      this.prisma.companyProject.count({ where: { companyId } }),
    ]);
    return companyView(company, { projects, followed: false });
  }
}
