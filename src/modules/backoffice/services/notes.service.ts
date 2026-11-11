import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { ForbiddenError, NotFoundError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditLogger, auditActorOf } from '../../audit';
import { CompaniesService } from '../../companies';

const SUBJECTS = { users: 'USER', companies: 'COMPANY' } as const;
export type NoteSubjectPath = keyof typeof SUBJECTS;

const noteSchema = z
  .object({
    body: z.string({ error: 'is required' }).trim().min(1, 'is required').max(4000, 'must be at most 4000 characters'),
  })
  .strict();

/** contracts/admin `Note`. */
export interface NoteView {
  id: string;
  body: string;
  author: { id: string; name: string };
  createdAt: Date;
}

/**
 * Internal staff notes on a user or a company (contracts/admin /{subject}/{id}/notes,
 * `notes.view` / `notes.write`). Append-only (a trigger refuses edits), newest first,
 * never shown on the app surface.
 */
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly companies: CompaniesService,
  ) {}

  async list(actor: Actor | undefined, subject: string, subjectId: string): Promise<NoteView[]> {
    this.requireStaff(actor, 'notes.view');
    const subjectType = await this.requireSubject(subject, subjectId);
    const notes = await this.prisma.staffNote.findMany({
      where: { subjectType, subjectId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return notes.map((n) => ({ id: n.id, body: n.body, author: n.author, createdAt: n.createdAt }));
  }

  async add(actor: Actor | undefined, subject: string, subjectId: string, input: unknown): Promise<NoteView> {
    const staff = this.requireStaff(actor, 'notes.write');
    const subjectType = await this.requireSubject(subject, subjectId);
    const { body } = parseInput(noteSchema, input);
    const note = await this.transactions.run(async (tx) => {
      const created = await tx.staffNote.create({
        data: { subjectType, subjectId, body, authorStaffId: staff.staffId },
        include: { author: { select: { id: true, name: true } } },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'note.create',
        entityType: subjectType === 'USER' ? 'user' : 'company',
        entityId: subjectId,
        changes: { after: { note_id: created.id } },
      });
      return created;
    });
    return { id: note.id, body: note.body, author: note.author, createdAt: note.createdAt };
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }

  private async requireSubject(subject: string, subjectId: string): Promise<'USER' | 'COMPANY'> {
    const subjectType = SUBJECTS[subject as NoteSubjectPath];
    const valid = subjectType && z.string().uuid().safeParse(subjectId).success;
    const exists =
      valid &&
      (subjectType === 'USER'
        ? (await this.prisma.user.count({ where: { id: subjectId } })) > 0
        : await this.companies.exists(subjectId));
    if (!exists) throw new NotFoundError('Not found');
    return subjectType;
  }
}
