import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember } from '../../../common/context/actor';
import { DomainError, ErrorCode, NotEligibleError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditActorType, AuditLogger, auditActorOf } from '../../audit';
import { CompaniesService, CompanyCard, requireCompanyActor } from '../../companies';
import { ProfilesService, visibleContact } from '../../profiles';
import { VerificationReviewService } from '../../verification';
import {
  ApplicationStatus,
  blocksNewApplication,
  canCompanyMove,
  canWithdraw,
  COMPANY_MOVES,
  requireApplicationDecider,
} from '../domain/application-status.policy';
import { applyRefusal } from '../domain/opportunity-type.policy';
import {
  ApplicantSnapshot,
  applicationInclude,
  ApplicationRow,
  ApplicationView,
  applicationView,
  ListingSnapshot,
} from './application-views';

const MESSAGE_MAX = 500;
const LIST_LIMIT = 200;
const WEEK_MS = 7 * 24 * 3_600_000;

const applySchema = z
  .object({
    opportunity_id: z.string({ error: 'is required' }).max(64),
    experience_ids: z
      .array(z.string().max(64), { error: 'is required' })
      .min(1, 'select at least one experience item')
      .max(30)
      .refine((ids) => new Set(ids).size === ids.length, 'must not repeat an item'),
    project_ids: z
      .array(z.string().max(64))
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length, 'must not repeat an item')
      .optional(),
    message: z.string().trim().max(MESSAGE_MAX, `must be at most ${MESSAGE_MAX} characters`).nullable().optional(),
  })
  .strict();

const moveSchema = z.object({ status: z.enum(COMPANY_MOVES, { error: 'is not a status you can set' }) }).strict();

const recentSchema = z.object({ limit: z.number().int().min(1).max(20) });

/** The individual's view: the application with the company's card. */
export interface MyApplicationView extends ApplicationView {
  company: CompanyCard;
}

/** The owning company's view: contact details only from the CONTACT stage, as shared. */
export interface ApplicantApplicationView extends ApplicationView {
  contact: { email: string | null; phone: string | null } | null;
}

/**
 * Applications (contracts/app /me/applications*, /company/applicants*,
 * /company/opportunities/{id}/applicants; docs/app/README.md §4 "Applications").
 *
 * - Individuals apply to open individual-facing listings (`NOT_ELIGIBLE` with a reason
 *   otherwise), once per listing unless they withdrew (`ALREADY_APPLIED`), picking items
 *   from their own profile. The applicant and listing are snapshotted at submission.
 * - Only the Company Account that owns the listing moves the status
 *   (application-status.policy.ts); staff never do, whatever their role.
 * - Every status change, SUBMITTED and WITHDRAWN included, notifies the applicant
 *   (`application.status_changed`).
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly companies: CompaniesService,
    private readonly profiles: ProfilesService,
    private readonly verification: VerificationReviewService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  // ---- The applicant ----

  /** POST /me/applications. Eligibility first (403), then duplicates (409), then the picks (422). */
  async apply(actor: Actor | undefined, input: unknown, locale: Locale): Promise<MyApplicationView> {
    const member = requireMember(actor);
    const data = parseInput(applySchema, input);
    const listing = isUuid(data.opportunity_id)
      ? await this.prisma.opportunity.findFirst({
          where: { id: data.opportunity_id, company: { accountUser: { status: 'ACTIVE' } } },
        })
      : null;
    // Drafts, listings in review and listings of a suspended company do not exist for the applicant.
    if (!listing || !['PUBLISHED', 'CLOSED'].includes(listing.status)) {
      throw new NotFoundError('Opportunity not found');
    }
    const profile = await this.profiles.get(actor, locale);
    const now = this.clock.now();
    const open = listing.status === 'PUBLISHED' && (!listing.closesAt || listing.closesAt > now);
    const refusal = applyRefusal(
      { type: listing.type, open },
      { kind: 'member', student: profile.profileStatus === 'STUDENT' },
    );
    if (refusal) throw new NotEligibleError(refusal, REFUSAL_MESSAGES[refusal]);
    await this.requireNoBlockingApplication(this.prisma, listing.id, member.userId);

    const experience = profile.experience.filter((e) => data.experience_ids.includes(e.id));
    const projects = profile.projects.filter((p) => (data.project_ids ?? []).includes(p.id));
    const errors: Record<string, string[]> = {};
    if (experience.length !== data.experience_ids.length) errors.experience_ids = ['must be from your own profile'];
    if (projects.length !== (data.project_ids ?? []).length) errors.project_ids = ['must be from your own profile'];
    if (Object.keys(errors).length > 0) throw new ValidationFailedError(errors);

    const verified = (await this.verification.verifiedUserIds([member.userId])).has(member.userId);
    const applicant: ApplicantSnapshot = {
      name: profile.name,
      headline: profile.headline,
      profileStatus: profile.profileStatus,
      verified,
      city: profile.city,
      skills: profile.skills,
    };
    const snapshot: ListingSnapshot = {
      title: listing.title,
      type: listing.type,
      city: listing.city,
      employmentType: listing.employmentType,
      compensation: listing.compensation,
    };
    const id = uuidv7(now.getTime());
    await this.transactions.run(async (tx) => {
      // One at a time per member and listing; the partial unique index backs this up.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`application:${listing.id}:${member.userId}`}))`;
      await this.requireNoBlockingApplication(tx, listing.id, member.userId);
      await tx.application.create({
        data: {
          id,
          opportunityId: listing.id,
          applicantUserId: member.userId,
          message: data.message || null,
          applicant: applicant as unknown as Prisma.InputJsonObject,
          listing: snapshot as unknown as Prisma.InputJsonObject,
          experience: experience as unknown as Prisma.InputJsonArray,
          projects: projects as unknown as Prisma.InputJsonArray,
          submittedAt: now,
          statusChangedAt: now,
        },
      });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId: member.userId },
        action: 'application.submit',
        entityType: 'application',
        entityId: id,
        changes: { after: { opportunity_id: listing.id, status: 'SUBMITTED' } },
      });
      await this.emitStatusChanged(id, listing.id, member.userId, snapshot.title, 'SUBMITTED', {
        type: 'USER',
        user_id: member.userId,
      });
    });
    return this.mineOne(member.userId, id);
  }

  /** GET /me/applications, most recently updated first. */
  async mine(actor: Actor | undefined): Promise<MyApplicationView[]> {
    const { userId } = requireMember(actor);
    const rows = await this.prisma.application.findMany({
      where: { applicantUserId: userId },
      include: applicationInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
    return this.withCompanies(rows);
  }

  /** POST /me/applications/{id}/withdraw. Only an active application. */
  async withdraw(actor: Actor | undefined, applicationId: string): Promise<MyApplicationView> {
    const { userId } = requireMember(actor);
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, applicationId);
      if (!row || row.applicantUserId !== userId) throw new NotFoundError('Application not found');
      if (!canWithdraw(row.status)) throw this.invalidTransition(row.status, 'WITHDRAWN');
      await this.moveTo(tx, row, 'WITHDRAWN', { type: 'USER', user_id: userId });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId },
        action: 'application.withdraw',
        entityType: 'application',
        entityId: row.id,
        changes: { before: { status: row.status }, after: { status: 'WITHDRAWN' } },
      });
    });
    return this.mineOne(userId, applicationId);
  }

  // ---- The owning company ----

  /** GET /company/opportunities/{id}/applicants, most recently updated first. */
  async forListing(actor: Actor | undefined, opportunityId: string): Promise<ApplicantApplicationView[]> {
    const company = requireCompanyActor(actor, 'REVIEW_APPLICANTS');
    const owned = isUuid(opportunityId)
      ? await this.prisma.opportunity.count({ where: { id: opportunityId, companyId: company.companyId } })
      : 0;
    if (owned === 0) throw new NotFoundError('Opportunity not found');
    const rows = await this.prisma.application.findMany({
      where: { opportunityId },
      include: applicationInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
    return this.forCompany(rows);
  }

  /** GET /company/applicants/recent: newest applications across all own listings. */
  async recent(actor: Actor | undefined, input: unknown): Promise<ApplicantApplicationView[]> {
    const company = requireCompanyActor(actor, 'REVIEW_APPLICANTS');
    const { limit } = parseInput(recentSchema, input);
    const rows = await this.prisma.application.findMany({
      where: { opportunity: { companyId: company.companyId } },
      include: applicationInclude,
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return this.forCompany(rows);
  }

  /** GET /company/applicants/{id}. Opening it never changes the status or releases contact details. */
  async getForCompany(actor: Actor | undefined, applicationId: string): Promise<ApplicantApplicationView> {
    const company = requireCompanyActor(actor, 'REVIEW_APPLICANTS');
    return (await this.forCompany([await this.findOwned(this.prisma, company.companyId, applicationId)]))[0];
  }

  /**
   * POST /company/applicants/{id}/status: one step forward, accept from CONTACT, or reject.
   * Only the owning Company Account (staff are refused whatever their role).
   */
  async changeStatus(
    actor: Actor | undefined,
    applicationId: string,
    input: unknown,
  ): Promise<ApplicantApplicationView> {
    const company = requireApplicationDecider(actor);
    const { status } = parseInput(moveSchema, input);
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, applicationId);
      if (!row || row.opportunity.companyId !== company.companyId) throw new NotFoundError('Application not found');
      if (!canCompanyMove(row.status, status)) throw this.invalidTransition(row.status, status);
      await this.moveTo(tx, row, status, { type: 'USER', user_id: company.userId });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'application.status_change',
        entityType: 'application',
        entityId: row.id,
        changes: { before: { status: row.status }, after: { status } },
      });
    });
    return this.getForCompany(actor, applicationId);
  }

  /** contracts/app `CompanyStats.new_applicants` (SUBMITTED) and `new_applicants_this_week`. */
  async companyCounts(companyId: string): Promise<{ newApplicants: number; newApplicantsThisWeek: number }> {
    const since = new Date(this.clock.now().getTime() - WEEK_MS);
    const scope = { opportunity: { companyId } };
    const [newApplicants, newApplicantsThisWeek] = await Promise.all([
      this.prisma.application.count({ where: { ...scope, status: 'SUBMITTED' } }),
      this.prisma.application.count({ where: { ...scope, submittedAt: { gte: since } } }),
    ]);
    return { newApplicants, newApplicantsThisWeek };
  }

  // ---- Shared ----

  private async requireNoBlockingApplication(db: PrismaService | Tx, opportunityId: string, userId: string) {
    const earlier = await db.application.findMany({
      where: { opportunityId, applicantUserId: userId },
      select: { status: true },
    });
    if (earlier.some((a) => blocksNewApplication(a.status))) {
      throw new DomainError(ErrorCode.ALREADY_APPLIED, 'You already applied to this listing', HttpStatus.CONFLICT);
    }
  }

  private async moveTo(
    tx: Tx,
    row: ApplicationRow,
    status: ApplicationStatus,
    actor: { type: 'USER'; user_id: string },
  ): Promise<void> {
    const now = this.clock.now();
    await tx.application.update({ where: { id: row.id }, data: { status, statusChangedAt: now } });
    const title = (row.listing as unknown as ListingSnapshot).title;
    await this.emitStatusChanged(row.id, row.opportunityId, row.applicantUserId, title, status, actor);
  }

  /** Feeds the applicant's notification for every official status change. */
  private async emitStatusChanged(
    applicationId: string,
    opportunityId: string,
    applicantUserId: string,
    title: string,
    status: ApplicationStatus,
    actor: { type: 'USER'; user_id: string },
  ): Promise<void> {
    await this.outbox.emit({
      name: 'application.status_changed',
      aggregateType: 'application',
      aggregateId: applicationId,
      actor,
      data: {
        application_id: applicationId,
        opportunity_id: opportunityId,
        applicant_user_id: applicantUserId,
        opportunity_title: title,
        status,
      },
    });
  }

  private async mineOne(userId: string, applicationId: string): Promise<MyApplicationView> {
    const row = await this.prisma.application.findFirst({
      where: { id: applicationId, applicantUserId: userId },
      include: applicationInclude,
    });
    if (!row) throw new NotFoundError('Application not found');
    return (await this.withCompanies([row]))[0];
  }

  private async withCompanies(rows: ApplicationRow[]): Promise<MyApplicationView[]> {
    if (rows.length === 0) return [];
    const cards = await this.companies.cards(rows.map((r) => r.opportunity.companyId));
    return rows.map((row) => ({ ...applicationView(row), company: cards.get(row.opportunity.companyId)! }));
  }

  /** Contact details are read live and only released from CONTACT, as the applicant shares them. */
  private async forCompany(rows: ApplicationRow[]): Promise<ApplicantApplicationView[]> {
    return Promise.all(
      rows.map(async (row) => {
        const view = applicationView(row);
        const subject = ['CONTACT', 'ACCEPTED'].includes(row.status)
          ? await this.profiles.contactSubject(row.applicantUserId)
          : null;
        const shared = subject ? visibleContact(subject, { kind: 'company', applicationStatus: row.status }) : null;
        return { ...view, contact: shared && (shared.email || shared.phone) ? shared : null };
      }),
    );
  }

  private async findOwned(db: PrismaService | Tx, companyId: string, applicationId: string): Promise<ApplicationRow> {
    const row = isUuid(applicationId)
      ? await db.application.findFirst({
          where: { id: applicationId, opportunity: { companyId } },
          include: applicationInclude,
        })
      : null;
    if (!row) throw new NotFoundError('Application not found');
    return row;
  }

  private async lock(tx: Tx, applicationId: string): Promise<ApplicationRow | null> {
    if (!isUuid(applicationId)) return null;
    await tx.$queryRaw`SELECT 1 FROM app.applications WHERE id = ${applicationId}::uuid FOR UPDATE`;
    return tx.application.findUnique({ where: { id: applicationId }, include: applicationInclude });
  }

  private invalidTransition(from: ApplicationStatus, to: ApplicationStatus): DomainError {
    return new DomainError(
      ErrorCode.INVALID_TRANSITION,
      `Cannot move a ${from.toLowerCase()} application to ${to.toLowerCase()}`,
      HttpStatus.CONFLICT,
    );
  }
}

const REFUSAL_MESSAGES = {
  COMPANY_FACING: 'This listing is for companies.',
  INDIVIDUALS_ONLY: 'Only individuals apply to listings.',
  CLOSED: 'This listing is not open for applications.',
  STUDENTS_ONLY: 'Co-op training is for students.',
} as const;
