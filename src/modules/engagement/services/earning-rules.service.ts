import { HttpStatus, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditLogger, auditActorOf } from '../../audit';

export const EARNING_RULE_KEYS = [
  'EVENT_REGISTRATION',
  'EVENT_ATTENDANCE',
  'VOLUNTEER_SHIFT',
  'PROFILE_COMPLETED',
  'REFERRAL_ATTENDED',
] as const;

/** The audit entity for the earning-rule table (the rules are keyed, not by uuid). */
export const EARNING_RULES_ENTITY_ID = '00000000-0000-7000-8000-0000000e4e01';

export type EarningRuleKey = (typeof EARNING_RULE_KEYS)[number];

/** contracts/admin `EarningRule`. */
export interface EarningRuleView {
  key: EarningRuleKey;
  points: number;
  enabled: boolean;
  limitNote: string | null;
  locked: boolean;
}

const updateSchema = z
  .object({
    points: z.number().int('must be a whole number').min(0, 'must be 0 or more').max(100_000).optional(),
    enabled: z.boolean().optional(),
    limit_note: z.string().trim().max(200).optional(),
  })
  .strict();

/**
 * Earning rules (contracts/admin /earning-rules, BQ-77). A change applies from then on;
 * entries already written keep what they earned. EVENT_REGISTRATION is locked at 0
 * (422 `RULE_LOCKED`): registering never earns points.
 */
@Injectable()
export class EarningRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
  ) {}

  /** GET /earning-rules (`rewards.view`), in the catalog order. */
  async list(actor: Actor | undefined): Promise<EarningRuleView[]> {
    this.requireStaff(actor, 'rewards.view');
    const rows = await this.prisma.earningRule.findMany();
    return EARNING_RULE_KEYS.map((key) => rows.find((r) => r.key === key))
      .filter((r) => r !== undefined)
      .map(view);
  }

  /** PUT /earning-rules/{key} (`settings.manage`). */
  async update(actor: Actor | undefined, key: string, input: unknown): Promise<EarningRuleView> {
    const staff = this.requireStaff(actor, 'settings.manage');
    const data = parseInput(updateSchema, input ?? {});
    key = key.toUpperCase();
    if (!(EARNING_RULE_KEYS as readonly string[]).includes(key)) throw new NotFoundError('Earning rule not found');
    return this.transactions.run(async (tx) => {
      const rule = await tx.earningRule.findUnique({ where: { key: key as EarningRuleKey } });
      if (!rule) throw new NotFoundError('Earning rule not found');
      if (rule.locked) {
        throw new DomainError(
          ErrorCode.RULE_LOCKED,
          'Registering for an event never earns points',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const updated = await tx.earningRule.update({
        where: { key: rule.key },
        data: {
          ...(data.points !== undefined ? { points: data.points } : {}),
          ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
          ...(data.limit_note !== undefined ? { limitNote: data.limit_note || null } : {}),
          updatedByStaffId: staff.staffId,
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'earning_rule.update',
        entityType: 'earning_rules',
        entityId: EARNING_RULES_ENTITY_ID,
        changes: {
          before: { key: rule.key, points: rule.points, enabled: rule.enabled, limit_note: rule.limitNote },
          after: { points: updated.points, enabled: updated.enabled, limit_note: updated.limitNote },
        },
      });
      return view(updated);
    });
  }

  /** The points a rule earns now, or null when it is turned off. */
  async pointsFor(key: EarningRuleKey): Promise<number | null> {
    const rule = await this.prisma.earningRule.findUnique({ where: { key } });
    return rule && rule.enabled ? rule.points : null;
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

function view(rule: {
  key: EarningRuleKey;
  points: number;
  enabled: boolean;
  limitNote: string | null;
  locked: boolean;
}): EarningRuleView {
  return { key: rule.key, points: rule.points, enabled: rule.enabled, limitNote: rule.limitNote, locked: rule.locked };
}
