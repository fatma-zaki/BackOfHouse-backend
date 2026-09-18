import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from './prisma.service';

/** The client handed to code running inside a transaction. */
export type Tx = Prisma.TransactionClient;

export interface TransactionOptions {
  /** Upper bound for the whole transaction. Keep use cases short (no network calls inside). */
  timeoutMs?: number;
  /** How long to wait for a pooled connection. */
  maxWaitMs?: number;
}

/** Serialization failure and deadlock (database-design-rules.md §14). */
const RETRYABLE_SQLSTATES = new Set(['40001', '40P01']);
/** Prisma's code for "write conflict or deadlock, please retry". */
const PRISMA_RETRYABLE_CODE = 'P2034';
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_WAIT_MS = 5_000;

/**
 * Finds a SQLSTATE or Prisma code anywhere in an error chain. The driver
 * adapter nests the original Postgres error, and its shape is not a public API,
 * so the search is structural rather than tied to one path.
 */
export function isRetryableTransactionError(error: unknown, depth = 0): boolean {
  if (depth > 5 || error === null || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  for (const key of ['code', 'originalCode', 'sqlState']) {
    const value = record[key];
    if (typeof value === 'string' && (RETRYABLE_SQLSTATES.has(value) || value === PRISMA_RETRYABLE_CODE)) {
      return true;
    }
  }

  return ['cause', 'meta', 'driverAdapterError'].some((key) => isRetryableTransactionError(record[key], depth + 1));
}

/**
 * One application use case = one transaction (database-design-rules.md §14).
 *
 * `run()` opens an interactive transaction and exposes it through
 * AsyncLocalStorage, so AuditLogger, OutboxWriter and ports called anywhere
 * below join it without a `tx` argument being threaded through every layer.
 * A nested `run()` joins the outer transaction instead of opening a new one.
 * Serialization failures and deadlocks are retried up to three times.
 */
@Injectable()
export class TransactionRunner {
  private readonly logger = new Logger(TransactionRunner.name);
  private readonly storage = new AsyncLocalStorage<Tx>();

  constructor(private readonly prisma: PrismaService) {}

  async run<T>(work: (tx: Tx) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const current = this.storage.getStore();
    if (current) {
      return work(current);
    }

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.prisma.$transaction((tx) => this.storage.run(tx, () => work(tx)), {
          timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
          maxWait: options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS,
        });
      } catch (error) {
        if (attempt >= MAX_RETRIES || !isRetryableTransactionError(error)) {
          throw error;
        }
        this.logger.warn(`Retrying transaction after a serialization failure or deadlock (attempt ${attempt + 1})`);
      }
    }
  }

  /** The active transaction, if the caller is inside `run()`. */
  current(): Tx | undefined {
    return this.storage.getStore();
  }

  /**
   * Transaction if one is open, otherwise the root client. Use for reads and
   * for writes that must join the caller's transaction when there is one.
   */
  client(): Tx {
    return this.storage.getStore() ?? this.prisma;
  }

  /** Throws when called outside a transaction; for writes that must never run alone. */
  requireTransaction(operation: string): Tx {
    const current = this.storage.getStore();
    if (!current) {
      throw new Error(`${operation} must run inside TransactionRunner.run()`);
    }
    return current;
  }
}
