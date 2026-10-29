import { HttpStatus, Injectable } from '@nestjs/common';
import { ConflictError, DomainError, ErrorCode } from '../../common/errors';
import { uuidv7 } from '../../common/ids/uuid-v7';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

/** Responses are replayed for 24 h (docs/admin/docs/04-api-conventions.md "Idempotency"). */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface IdempotencyRequest {
  scope: string;
  key: string;
  method: string;
  path: string;
  requestHash: string;
}

export type IdempotencyBegin = { kind: 'new'; id: string } | { kind: 'replay'; status: number; body: Prisma.JsonValue };

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Persistence for Idempotency-Key. `begin` reserves the key (IN_PROGRESS) or
 * returns the stored response; `complete` stores the first response; `abandon`
 * frees the key when the operation failed, so the client can retry.
 */
@Injectable()
export class IdempotencyStore {
  constructor(private readonly prisma: PrismaService) {}

  async begin(request: IdempotencyRequest, now = new Date()): Promise<IdempotencyBegin> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const id = uuidv7();
        await this.prisma.idempotencyRecord.create({
          data: {
            id,
            scope: request.scope,
            idempotencyKey: request.key,
            method: request.method,
            path: request.path,
            requestHash: request.requestHash,
            expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS),
          },
        });
        return { kind: 'new', id };
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }

      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { scope_idempotencyKey: { scope: request.scope, idempotencyKey: request.key } },
      });
      if (!existing) {
        continue; // freed between the insert and the read: try again
      }
      if (existing.expiresAt <= now) {
        await this.prisma.idempotencyRecord.deleteMany({ where: { id: existing.id } });
        continue;
      }
      if (existing.requestHash !== request.requestHash) {
        throw new DomainError(
          ErrorCode.IDEMPOTENCY_KEY_REUSED,
          'This Idempotency-Key was already used with a different request',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (existing.status === 'IN_PROGRESS') {
        throw new ConflictError(
          'A request with this Idempotency-Key is still being processed',
          ErrorCode.IDEMPOTENCY_KEY_IN_USE,
        );
      }
      return { kind: 'replay', status: existing.responseStatus ?? HttpStatus.OK, body: existing.responseBody };
    }
    throw new ConflictError('Could not reserve the Idempotency-Key; retry', ErrorCode.IDEMPOTENCY_KEY_IN_USE);
  }

  async complete(id: string, status: number, body: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.idempotencyRecord.update({
      where: { id },
      data: { status: 'COMPLETED', responseStatus: status, responseBody: body },
    });
  }

  async abandon(id: string): Promise<void> {
    await this.prisma.idempotencyRecord.deleteMany({ where: { id, status: 'IN_PROGRESS' } });
  }

  /** Deletes expired records (job `idempotency.purge`, hourly). */
  async purgeExpired(now = new Date()): Promise<number> {
    const { count } = await this.prisma.idempotencyRecord.deleteMany({ where: { expiresAt: { lt: now } } });
    return count;
  }
}
