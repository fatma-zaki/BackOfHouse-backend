import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../platform/database/transaction-runner';
import { RequestContext } from '../../common/context/request-context';
import { uuidv7 } from '../../common/ids/uuid-v7';
import type { Prisma } from '../../generated/prisma/client';
import { AuditRecordInput } from './audit.types';
import { redact } from './redact';

/**
 * Writes `audit_logs` rows (ADR-016).
 *
 * `record()` must be called inside TransactionRunner.run(): the audit row
 * commits if and only if the audited mutation commits. It throws when called
 * outside a transaction, so a use case cannot silently skip atomic auditing.
 * The request id, IP and user agent come from the request context.
 */
@Injectable()
export class AuditLogger {
  constructor(private readonly transactions: TransactionRunner) {}

  async record(input: AuditRecordInput): Promise<string> {
    const tx = this.transactions.requireTransaction('AuditLogger.record');
    const context = RequestContext.current();
    const id = uuidv7();

    await tx.auditLog.create({
      data: {
        id,
        actorType: input.actor.type,
        actorUserId: input.actor.userId ?? null,
        actorPlatformRoles: input.actor.platformRoles ?? [],
        organizationId: input.organizationId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes ? (redact(input.changes) as Prisma.InputJsonValue) : undefined,
        reason: input.reason ?? null,
        requestId: RequestContext.requestId(),
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent?.slice(0, 512) ?? null,
      },
    });

    return id;
  }
}
