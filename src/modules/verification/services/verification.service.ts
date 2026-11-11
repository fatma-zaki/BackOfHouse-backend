import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { uuidv7 } from '../../../common/ids/uuid-v7';
import { AppConfig } from '../../../config/app.config';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { MALWARE_SCANNER, MalwareScanner } from '../../../platform/scanning';
import { STORAGE_PORT, StoragePort } from '../../../platform/storage';
import { AuditActorType, AuditLogger, auditActorOf } from '../../audit';
import { addWorkingDays } from '../../../common/time/working-days';
import { displayFileName, MAX_DOCUMENT_BYTES, sniffDocument } from '../domain/document-file';
import { appStatusOf, canEditDocuments, nextState, VerificationState } from '../domain/verification-state';

/** Review deadline (execution-plan.md Phase 4): 3 working days after submission. */
export const REVIEW_WORKING_DAYS = 3;

export const VERIFICATION_DOCUMENTS = ['IDENTITY', 'EXPERIENCE'] as const;
export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENTS)[number];

/** An uploaded file as the HTTP layer hands it over (multer memory storage). */
export interface UploadedDocument {
  originalname?: string;
  size: number;
  buffer: Buffer;
}

/** contracts/app `VerificationRequest`. */
export interface VerificationRequestView {
  status: 'DRAFT' | 'IN_REVIEW';
  /** File name per uploaded document type. */
  files: Partial<Record<VerificationDocumentType, string>>;
  submittedAt: Date | null;
}

const locked = () =>
  new DomainError(ErrorCode.VERIFICATION_LOCKED, 'The request was already sent for review', HttpStatus.CONFLICT);

/**
 * An individual's verification request (contracts/app /me/verification*). Documents are
 * checked by their real type, scanned (MALWARE_SCANNER, TQ-10) and only then stored in the
 * private bucket. Submitting moves the request to IN_REVIEW and emits
 * `verification.submitted`; it never grants verification (Phase 4 decides).
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly config: AppConfig,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(MALWARE_SCANNER) private readonly scanner: MalwareScanner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** A DRAFT with no files when the member has not started one. */
  async get(actor: Actor | undefined): Promise<VerificationRequestView> {
    const { userId } = requireMember(actor);
    const request = await this.prisma.verificationRequest.findUnique({
      where: { userId },
      include: { documents: { select: { document: true, fileName: true } } },
    });
    if (!request) return { status: 'DRAFT', files: {}, submittedAt: null };
    return {
      status: appStatusOf(request.status),
      files: Object.fromEntries(request.documents.map((d) => [d.document, d.fileName])),
      submittedAt: request.submittedAt,
    };
  }

  /** Uploading the same type again replaces it; only while the request is open to the member. */
  async uploadDocument(
    actor: Actor | undefined,
    documentInput: unknown,
    file: UploadedDocument | undefined,
  ): Promise<VerificationRequestView> {
    const { userId } = requireMember(actor);
    const document = z.enum(VERIFICATION_DOCUMENTS).safeParse(documentInput);
    if (!document.success) throw new ValidationFailedError({ document: ['must be IDENTITY or EXPERIENCE'] });
    if (!file || file.size === 0) throw new ValidationFailedError({ file: ['is required'] });
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new DomainError(ErrorCode.FILE_TOO_LARGE, 'Files are limited to 10 MB', HttpStatus.PAYLOAD_TOO_LARGE);
    }
    const kind = sniffDocument(file.buffer);
    if (!kind) throw new ValidationFailedError({ file: ['must be a PDF, JPEG or PNG file'] });

    // Answer 409 before the scan when the request is already locked.
    const current = await this.prisma.verificationRequest.findUnique({ where: { userId }, select: { status: true } });
    if (current && !canEditDocuments(current.status)) throw locked();

    if ((await this.scanner.scan(file.buffer)) !== 'CLEAN') {
      throw new ValidationFailedError({ file: ['did not pass the virus scan'] });
    }

    const bucket = this.config.storage.privateBucket;
    const path = `verification/${userId}/${uuidv7()}.${kind.extension}`;
    await this.storage.upload(bucket, path, file.buffer, kind.contentType);

    let replaced: { bucket: string; path: string } | null = null;
    try {
      replaced = await this.transactions.run(async (tx) => {
        const request = await this.lockRequest(tx, userId);
        if (!canEditDocuments(request.status)) throw locked();
        const previous = await tx.verificationDocument.findUnique({
          where: { requestId_document: { requestId: request.id, document: document.data } },
          select: { bucket: true, path: true },
        });
        const data = {
          fileName: displayFileName(file.originalname, kind.extension),
          contentType: kind.contentType,
          sizeBytes: file.size,
          sha256: createHash('sha256').update(file.buffer).digest('hex'),
          bucket,
          path,
          uploadedAt: this.clock.now(),
        };
        await tx.verificationDocument.upsert({
          where: { requestId_document: { requestId: request.id, document: document.data } },
          create: { requestId: request.id, document: document.data, ...data },
          update: data,
        });
        await this.audit.record({
          actor: { type: AuditActorType.USER, userId },
          action: 'verification.document.upload',
          entityType: 'verification_request',
          entityId: request.id,
          changes: { after: { document: document.data, content_type: kind.contentType, size_bytes: file.size } },
        });
        return previous;
      });
    } catch (error) {
      await this.removeQuietly(bucket, path);
      throw error;
    }
    if (replaced) await this.removeQuietly(replaced.bucket, replaced.path);
    return this.get(actor);
  }

  /**
   * Needs both documents; moves the request to IN_REVIEW with a deadline of 3 working
   * days. Also used to resubmit after MORE_INFO or REJECTED.
   */
  async submit(actor: Actor | undefined): Promise<VerificationRequestView> {
    const { userId } = requireMember(actor);
    await this.transactions.run(async (tx) => {
      const existing = await tx.verificationRequest.findUnique({ where: { userId }, select: { id: true } });
      if (!existing) throw this.incomplete();
      const request = await this.lockRequest(tx, userId);
      if (!nextState(request.status, 'submit')) throw locked();
      const documents = await tx.verificationDocument.findMany({
        where: { requestId: request.id },
        select: { document: true },
      });
      if (!VERIFICATION_DOCUMENTS.every((type) => documents.some((d) => d.document === type))) {
        throw this.incomplete();
      }
      const now = this.clock.now();
      const dueAt = addWorkingDays(now, REVIEW_WORKING_DAYS);
      await tx.verificationRequest.update({
        where: { id: request.id },
        data: {
          status: 'IN_REVIEW',
          submittedAt: now,
          dueAt,
          decidedAt: null,
          decidedByStaffId: null,
          decisionNote: null,
        },
      });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId },
        action: 'verification.submit',
        entityType: 'verification_request',
        entityId: request.id,
        changes: { before: { status: request.status }, after: { status: 'IN_REVIEW' } },
      });
      await this.outbox.emit({
        name: 'verification.submitted',
        aggregateType: 'verification_request',
        aggregateId: request.id,
        actor: { type: 'USER', user_id: userId },
        data: {
          verification_id: request.id,
          type: 'INDIVIDUAL',
          subject_ref: { kind: 'user', id: userId },
          due_at: dueAt.toISOString(),
        },
      });
    });
    return this.get(actor);
  }

  /**
   * The only way to reach a document: a short-lived signed URL for staff who may view
   * verifications. Every URL issued writes an audit row (security-and-audit.md §4).
   */
  async documentUrl(actor: Actor | undefined, documentId: string): Promise<{ url: string; expiresIn: number }> {
    if (!staffHas(actor, 'verification.view')) throw new ForbiddenError();
    const found = z.string().uuid().safeParse(documentId).success
      ? await this.prisma.verificationDocument.findUnique({ where: { id: documentId } })
      : null;
    if (!found) throw new NotFoundError('Document not found');
    const expiresIn = this.config.storage.signedUrlTtlSeconds;
    const url = await this.storage.createSignedDownloadUrl(found.bucket, found.path, expiresIn);
    // The URL is handed out only once its audit row is committed.
    await this.transactions.run(() =>
      this.audit.record({
        actor: auditActorOf(actor),
        action: 'verification.view_document',
        entityType: 'verification_document',
        entityId: found.id,
        changes: { after: { request_id: found.requestId, document: found.document, expires_in: expiresIn } },
      }),
    );
    return { url, expiresIn };
  }

  private incomplete(): DomainError {
    return new DomainError(
      ErrorCode.VERIFICATION_INCOMPLETE,
      'Upload both the IDENTITY and the EXPERIENCE document first',
      HttpStatus.CONFLICT,
    );
  }

  /** The member's request, created as DRAFT if needed, locked for this transaction. */
  private async lockRequest(tx: Tx, userId: string): Promise<{ id: string; status: VerificationState }> {
    await tx.verificationRequest.upsert({ where: { userId }, create: { userId }, update: {} });
    const [row] = await tx.$queryRaw<{ id: string; status: VerificationState }[]>`
      SELECT id, status::text AS status FROM app.verification_requests WHERE user_id = ${userId}::uuid FOR UPDATE
    `;
    return row;
  }

  private async removeQuietly(bucket: string, path: string): Promise<void> {
    try {
      await this.storage.remove(bucket, [path]);
    } catch (error) {
      // An orphan object is harmless (private bucket, unknown path); log it for cleanup.
      this.logger.warn({ err: error, bucket, path }, 'Could not remove a verification object');
    }
  }
}
