import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditAction, AuditLogEntry, AuditLogRecord } from './audit.types';
import { Tables } from '../common/constants';
import { InternalOperationException } from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';

/** Keys that must never reach the audit trail, whatever a caller passes in. */
const REDACTED_KEYS = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'key', 'authorization'];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Records an action. Failures are logged but never propagated: an audit
   * problem must not roll back or fail the business operation that succeeded.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.databaseService.admin.from(Tables.AUDIT_LOGS).insert({
        actor_id: entry.actor_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id ?? null,
        metadata: this.redact(entry.metadata ?? {}),
      });

      if (error) {
        this.logger.error(`Audit write failed for ${entry.action}: ${error.message}`);
      }
    } catch (cause) {
      this.logger.error(
        `Audit write threw for ${entry.action}: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }
  }

  async list(
    pagination: PaginationParams,
    filters: { action?: AuditAction; entityType?: string; actorId?: UUID },
  ): Promise<ListResult<AuditLogRecord>> {
    let request = this.databaseService.admin
      .from(Tables.AUDIT_LOGS)
      .select('*', { count: 'exact' });

    if (filters.action) {
      request = request.eq('action', filters.action);
    }
    if (filters.entityType) {
      request = request.eq('entity_type', filters.entityType);
    }
    if (filters.actorId) {
      request = request.eq('actor_id', filters.actorId);
    }

    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Audit listing failed: ${error.message}`);
      throw new InternalOperationException('Unable to list audit logs');
    }

    return { data: (data ?? []) as AuditLogRecord[], total: count ?? 0 };
  }

  /** Drops sensitive-looking values one level deep before they are persisted. */
  private redact(metadata: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const isSensitive = REDACTED_KEYS.some((needle) => key.toLowerCase().includes(needle));
      safe[key] = isSensitive ? '[redacted]' : value;
    }

    return safe;
  }
}
