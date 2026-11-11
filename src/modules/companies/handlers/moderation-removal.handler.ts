import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../../platform/database';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';

const resolved = z.object({
  resolution: z.string(),
  target_type: z.string(),
  target_id: z.string().uuid(),
});

/**
 * Carries out "remove content" on a company portfolio project (moderation never writes
 * another module's tables, nest-module-map.md §4.11). Idempotent: an already removed
 * project is simply gone.
 */
@Injectable()
export class ModerationRemovalHandler {
  constructor(private readonly prisma: PrismaService) {}

  @OnDomainEvent('moderation.case.resolved')
  async resolved(event: DomainEvent): Promise<void> {
    const data = resolved.parse(event.payload);
    if (data.resolution !== 'CONTENT_REMOVED' || data.target_type !== 'COMPANY_PROJECT') return;
    await this.prisma.companyProject.deleteMany({ where: { id: data.target_id } });
  }
}
