import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import { MembersService } from '../../identity';
import {
  AdminVerificationStatus,
  adminStatusOf,
  nextState,
  stateOfAdminStatus,
  VerificationState,
  VerificationTransition,
} from '../domain/verification-state';
import { VerificationService } from './verification.service';

const SORTS = { created_at: 'createdAt', due_at: 'dueAt' } as const;

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?(created_at|due_at)$/, 'must be created_at or due_at, optionally prefixed with -')
    .optional(),
  status: z.enum(['PENDING', 'MORE_INFO', 'APPROVED', 'REJECTED']).optional(),
  subject_type: z.enum(['USER', 'COMPANY']).optional(),
});

const noteSchema = z.object({ note: z.string().trim().max(2000).optional() }).strict();
const messageSchema = z
  .object({
    message: z
      .string({ error: 'is required' })
      .trim()
      .min(1, 'is required')
      .max(2000, 'must be at most 2000 characters'),
  })
  .strict();
const reasonSchema = z
  .object({
    reason: z
      .string({ error: 'is required' })
      .trim()
      .min(1, 'is required')
      .max(2000, 'must be at most 2000 characters'),
  })
  .strict();

/** contracts/admin `VerificationRequest`, without document URLs (list) or with them (detail). */
export interface ReviewRequestView {
  id: string;
  subjectType: 'USER';
  subject: { id: string; name: string; kind: 'PROFESSIONAL' | 'STUDENT' };
  requestedBy: { id: string; fullName: string; verified: boolean; isStudent: boolean };
  documents: { id: string; kind: string; url: string; mime: string; size: number }[];
  status: AdminVerificationStatus;
  dueAt: Date | null;
  decisionNote: string | null;
  decidedBy: string | null;
  createdAt: Date;
}

/** Verification as the users table shows it (contracts/admin `UserAdminRow.verification`). */
export type UserVerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

const EVENTS: Record<Exclude<VerificationTransition, 'submit'>, string> = {
  approve: 'verification.approved',
  reject: 'verification.rejected',
  request_info: 'verification.info_requested',
  remove: 'verification.removed',
};

const ACTIONS = { approve: 'APPROVE', reject: 'REJECT', request_info: 'REQUEST_INFO', remove: 'REMOVE' } as const;

type RequestRow = Prisma.VerificationRequestGetPayload<{
  include: { decidedBy: { select: { name: true } }; documents: true };
}>;

/**
 * The review side of verification (contracts/admin /verification-requests*, Phase 4).
 * Decisions go through the state machine (domain/verification-state.ts), which is the only
 * way a member becomes or stops being verified. Each decision is audited, kept in
 * verification_decisions and announced as an event (the member is notified).
 */
@Injectable()
export class VerificationReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly members: MembersService,
    private readonly files: VerificationService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The review queue: submitted requests only, by deadline unless sorted otherwise. */
  async list(actor: Actor | undefined, input: unknown): Promise<{ items: ReviewRequestView[]; total: number }> {
    this.requireStaff(actor, 'verification.view');
    const query = parseInput(listSchema, input);
    // Only individuals have requests until company verification signals arrive (Phase 4B).
    if (query.subject_type === 'COMPANY') return { items: [], total: 0 };
    const where: Prisma.VerificationRequestWhereInput = query.status
      ? { status: stateOfAdminStatus(query.status) }
      : { status: { not: 'DRAFT' } };
    const sort = query.sort ?? 'due_at';
    const field = SORTS[sort.replace('-', '') as keyof typeof SORTS];
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const [rows, total] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        include: { decidedBy: { select: { name: true } }, documents: true },
        orderBy: [{ [field]: direction }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);
    return { items: await Promise.all(rows.map((row) => this.view(row))), total };
  }

  /**
   * One request with short-lived signed URLs for its documents. Each URL issued is audited
   * (`verification.view_document`).
   */
  async detail(actor: Actor | undefined, requestId: string): Promise<ReviewRequestView> {
    const staff = this.requireStaff(actor, 'verification.view');
    const row = await this.find(requestId);
    const view = await this.view(row);
    const documents = [];
    for (const doc of row.documents.sort((a, b) => a.document.localeCompare(b.document))) {
      const { url } = await this.files.documentUrl(staff, doc.id);
      documents.push({ id: doc.id, kind: doc.document, url, mime: doc.contentType, size: doc.sizeBytes });
    }
    return { ...view, documents };
  }

  async approve(actor: Actor | undefined, requestId: string, input: unknown): Promise<ReviewRequestView> {
    const { note } = parseInput(noteSchema, input ?? {});
    return this.decide(actor, requestId, 'approve', note || null);
  }

  async reject(actor: Actor | undefined, requestId: string, input: unknown): Promise<ReviewRequestView> {
    return this.decide(actor, requestId, 'reject', parseInput(messageSchema, input).message);
  }

  async requestInfo(actor: Actor | undefined, requestId: string, input: unknown): Promise<ReviewRequestView> {
    return this.decide(actor, requestId, 'request_info', parseInput(messageSchema, input).message);
  }

  /** Removes a member's verification (contracts/admin POST /users/{id}/verification/remove). */
  async removeForUser(actor: Actor | undefined, userId: string, input: unknown): Promise<void> {
    this.requireStaff(actor, 'verification.decide');
    const { reason } = parseInput(reasonSchema, input);
    const request = z.string().uuid().safeParse(userId).success
      ? await this.prisma.verificationRequest.findUnique({ where: { userId }, select: { id: true } })
      : null;
    if (!request) throw this.notVerified();
    await this.decide(actor, request.id, 'remove', reason);
  }

  /** Verification for the users table, per user id (absent ids: NONE). */
  async statusesFor(userIds: readonly string[]): Promise<Map<string, UserVerificationStatus>> {
    const rows = userIds.length
      ? await this.prisma.verificationRequest.findMany({
          where: { userId: { in: [...userIds] } },
          select: { userId: true, status: true },
        })
      : [];
    const status = (s: VerificationState): UserVerificationStatus =>
      s === 'APPROVED' ? 'VERIFIED' : s === 'REJECTED' ? 'REJECTED' : s === 'DRAFT' ? 'NONE' : 'PENDING';
    return new Map(rows.map((row) => [row.userId, status(row.status)]));
  }

  /** The members among `userIds` who are verified (AppUser.is_verified, Profile.verified). */
  async verifiedUserIds(userIds: readonly string[]): Promise<Set<string>> {
    const statuses = await this.statusesFor(userIds);
    return new Set([...statuses].filter(([, s]) => s === 'VERIFIED').map(([id]) => id));
  }

  /** When and by whom a member was verified, or null. */
  async verifiedInfo(userId: string): Promise<{ verifiedAt: Date; verifiedBy: string | null } | null> {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { userId },
      select: { status: true, decidedAt: true, decidedBy: { select: { name: true } } },
    });
    if (request?.status !== 'APPROVED' || !request.decidedAt) return null;
    return { verifiedAt: request.decidedAt, verifiedBy: request.decidedBy?.name ?? null };
  }

  private async decide(
    actor: Actor | undefined,
    requestId: string,
    transition: Exclude<VerificationTransition, 'submit'>,
    note: string | null,
  ): Promise<ReviewRequestView> {
    const staff = this.requireStaff(actor, 'verification.decide');
    await this.find(requestId);
    await this.transactions.run(async (tx) => {
      const request = await this.lock(tx, requestId);
      const to = nextState(request.status, transition);
      if (!to) {
        if (transition === 'remove') throw this.notVerified();
        throw new DomainError(
          ErrorCode.INVALID_TRANSITION,
          `Cannot ${transition.replace('_', ' ')} a request that is ${request.status}`,
          HttpStatus.CONFLICT,
        );
      }
      const now = this.clock.now();
      await tx.verificationRequest.update({
        where: { id: requestId },
        data: { status: to, decidedAt: now, decidedByStaffId: staff.staffId, decisionNote: note },
      });
      await tx.verificationDecision.create({
        data: { requestId, action: ACTIONS[transition], note, staffId: staff.staffId, decidedAt: now },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: `verification.${transition}`,
        entityType: 'verification_request',
        entityId: requestId,
        changes: { before: { status: request.status }, after: { status: to } },
      });
      await this.outbox.emit({
        name: EVENTS[transition],
        aggregateType: 'verification_request',
        aggregateId: requestId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: {
          verification_id: requestId,
          type: 'INDIVIDUAL',
          subject_ref: { kind: 'user', id: request.userId },
          // Shown to the member in the notification (reject, request info).
          ...(transition === 'reject' || transition === 'request_info' ? { message: note } : {}),
        },
      });
    });
    return this.view(await this.find(requestId));
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }

  private notVerified(): DomainError {
    return new DomainError(ErrorCode.INVALID_TRANSITION, 'This member is not verified', HttpStatus.CONFLICT);
  }

  private async find(requestId: string): Promise<RequestRow> {
    const row = z.string().uuid().safeParse(requestId).success
      ? await this.prisma.verificationRequest.findUnique({
          where: { id: requestId },
          include: { decidedBy: { select: { name: true } }, documents: true },
        })
      : null;
    // A DRAFT was never sent for review: staff do not see it.
    if (!row || row.status === 'DRAFT') throw new NotFoundError('Verification request not found');
    return row;
  }

  private async lock(tx: Tx, requestId: string): Promise<{ status: VerificationState; userId: string }> {
    const [row] = await tx.$queryRaw<{ status: VerificationState; user_id: string }[]>`
      SELECT status::text AS status, user_id FROM app.verification_requests WHERE id = ${requestId}::uuid FOR UPDATE
    `;
    return { status: row.status, userId: row.user_id };
  }

  private async view(row: RequestRow): Promise<ReviewRequestView> {
    const member = await this.members.view(row.userId);
    const student = member.profileStatus === 'STUDENT';
    return {
      id: row.id,
      subjectType: 'USER',
      subject: { id: row.userId, name: member.fullName, kind: student ? 'STUDENT' : 'PROFESSIONAL' },
      requestedBy: {
        id: row.userId,
        fullName: member.fullName,
        verified: row.status === 'APPROVED',
        isStudent: student,
      },
      documents: [],
      status: adminStatusOf(row.status as Exclude<VerificationState, 'DRAFT'>),
      dueAt: row.dueAt,
      decisionNote: row.decisionNote,
      decidedBy: row.decidedBy?.name ?? null,
      createdAt: row.submittedAt ?? row.createdAt,
    };
  }
}
