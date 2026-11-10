import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor } from '../../../common/context/actor';
import { ForbiddenError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { decodeCursor, encodeCursor } from '../../../common/pagination';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../platform/database';
import type { DomainEvent } from '../../../platform/outbox';
import { PermissionKey, TeamService } from '../../access';
import { isKnownStaffType, StaffNotificationCategory, staffCatalogEntry } from '../domain/staff-catalog';
import { renderTemplate, TemplateVars } from '../domain/template';

const listSchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/** contracts/admin `Notification`. */
export interface StaffNotificationView {
  id: string;
  type: StaffNotificationCategory;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

const CURSOR_KEYS = ['created_at', 'id'];

/**
 * The admin bell (contracts/admin GET /notifications): each staff member's own items,
 * newest first, rendered in the request language. Rows come only from outbox handlers,
 * one per (event, staff member, type).
 */
@Injectable()
export class StaffBellService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly team: TeamService,
  ) {}

  /** Stores the item for every active staff member who may act on it. */
  async notifyStaff(event: DomainEvent, spec: { type: string; payload?: Record<string, string> }): Promise<number> {
    const entry = staffCatalogEntry(spec.type);
    const recipients = await this.team.activeStaffIdsWith(entry.permission as PermissionKey);
    if (recipients.length === 0) return 0;
    const { count } = await this.prisma.staffNotification.createMany({
      data: recipients.map((recipientStaffId) => ({
        recipientStaffId,
        type: entry.type,
        sourceEventId: event.event_id,
        payload: (spec.payload ?? {}) as Prisma.InputJsonObject,
      })),
      skipDuplicates: true,
    });
    return count;
  }

  async list(
    actor: Actor | undefined,
    input: { cursor?: string; limit?: number },
    locale: Locale,
  ): Promise<{ items: StaffNotificationView[]; nextCursor: string | null }> {
    if (actor?.kind !== 'staff') throw new ForbiddenError();
    const query = parseInput(listSchema, input);
    const after = query.cursor ? decodeCursor(query.cursor, CURSOR_KEYS) : null;
    const rows = await this.prisma.staffNotification.findMany({
      where: {
        recipientStaffId: actor.staffId,
        ...(after
          ? {
              OR: [
                { createdAt: { lt: new Date(String(after.created_at)) } },
                { createdAt: new Date(String(after.created_at)), id: { lt: String(after.id) } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const page = rows.slice(0, query.limit).filter((row) => isKnownStaffType(row.type));
    const last = rows.length > query.limit ? rows[query.limit - 1] : null;
    return {
      items: page.map((row) => {
        const entry = staffCatalogEntry(row.type);
        const vars = row.payload as TemplateVars;
        const text = (key: 'title' | 'body') => renderTemplate(entry.templates[locale][key], vars);
        return {
          id: row.id,
          type: entry.category,
          title: text('title'),
          body: text('body'),
          data: row.payload as Record<string, unknown>,
          readAt: row.readAt,
          createdAt: row.createdAt,
        };
      }),
      nextCursor: last ? encodeCursor({ created_at: last.createdAt.toISOString(), id: last.id }) : null,
    };
  }
}
