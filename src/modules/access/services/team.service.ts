import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { Actor, staffHas, StaffActor } from '../../../common/context/actor';
import {
  ConflictError,
  DomainError,
  ErrorCode,
  FieldErrors,
  ForbiddenError,
  NotFoundError,
  ValidationFailedError,
} from '../../../common/errors';
import { AppConfig } from '../../../config/app.config';
import type { StaffAccount } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditLogger, auditActorOf } from '../../audit';
import { PERMISSION_KEYS, PermissionKey, permissionsForRole, STAFF_ROLES, StaffRole } from '../domain/permissions';
import {
  canChangeStatus,
  isWorkspaceEmail,
  normalizeEmail,
  STAFF_HOME,
  wouldRemoveLastSuperAdmin,
} from '../domain/staff';
import { StaffSessionsService } from './staff-sessions.service';

/** contracts/admin `AdminUser`. */
export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'INVITED' | 'ACTIVE' | 'DISABLED';
  last_active_at: string | null;
  invited_at: string | null;
}

/** contracts/admin `AdminMe`. */
export interface AdminMeView {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  permissions: PermissionKey[];
  home: string;
}

/** contracts/admin `RolePermissions`. */
export interface RolePermissionsView {
  role: StaffRole;
  permissions: { key: PermissionKey; access: 'FULL' | 'NONE' }[];
}

const inviteSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    role: z.enum(STAFF_ROLES),
  })
  .strict();

const updateSchema = z
  .object({ role: z.enum(STAFF_ROLES).optional(), status: z.enum(['ACTIVE', 'DISABLED']).optional() })
  .strict()
  .refine((v) => v.role !== undefined || v.status !== undefined, { message: 'send role and/or status' });

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    (errors[issue.path.join('.') || '(body)'] ??= []).push(issue.message);
  }
  throw new ValidationFailedError(errors);
}

function assertStaff(actor: Actor | undefined, permission: PermissionKey): asserts actor is StaffActor {
  if (!staffHas(actor, permission)) {
    throw new ForbiddenError();
  }
}

const toView = (s: StaffAccount): AdminUserView => ({
  id: s.id,
  name: s.name,
  email: s.email,
  role: s.role as StaffRole,
  status: s.status,
  last_active_at: s.lastActiveAt?.toISOString() ?? null,
  invited_at: s.invitedAt?.toISOString() ?? null,
});

/**
 * The Back of House team (contracts/admin: /me, /roles, /team, /team/invites).
 * Permission checks are here as well as on the routes (execution-plan.md §1.4).
 * Every change is audited in its transaction; role changes and disabling end the
 * person's sessions immediately (ADR-032).
 */
@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly sessions: StaffSessionsService,
    private readonly config: AppConfig,
  ) {}

  async me(actor: Actor | undefined): Promise<AdminMeView> {
    if (actor?.kind !== 'staff') throw new ForbiddenError();
    const staff = await this.prisma.staffAccount.findUnique({ where: { id: actor.staffId } });
    if (!staff) throw new NotFoundError();
    const role = staff.role as StaffRole;
    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role,
      permissions: permissionsForRole(role),
      home: STAFF_HOME[role],
    };
  }

  roles(actor: Actor | undefined): RolePermissionsView[] {
    assertStaff(actor, 'team.view');
    return STAFF_ROLES.map((role) => {
      const held = new Set(permissionsForRole(role));
      return { role, permissions: PERMISSION_KEYS.map((key) => ({ key, access: held.has(key) ? 'FULL' : 'NONE' })) };
    });
  }

  async list(actor: Actor | undefined): Promise<AdminUserView[]> {
    assertStaff(actor, 'team.view');
    const staff = await this.prisma.staffAccount.findMany({ orderBy: [{ status: 'asc' }, { name: 'asc' }] });
    return staff.map(toView);
  }

  /** Invite = an INVITED account; the first Google sign-in with this email activates it. */
  async invite(actor: Actor | undefined, input: unknown): Promise<AdminUserView> {
    assertStaff(actor, 'team.manage');
    const invite = parse(inviteSchema, input);
    const email = normalizeEmail(invite.email);
    if (!isWorkspaceEmail(email, this.config.staffAuth.workspaceDomain)) {
      throw new DomainError(
        ErrorCode.EMAIL_DOMAIN_NOT_ALLOWED,
        'Staff must use a work email on the Back of House Google Workspace domain',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.transactions.run(async (tx) => {
      if (await tx.staffAccount.findUnique({ where: { email } })) {
        throw new ConflictError('This email already has a staff account', ErrorCode.STAFF_ALREADY_EXISTS);
      }
      const staff = await tx.staffAccount.create({
        data: { email, name: invite.name, role: invite.role, status: 'INVITED', invitedByStaffId: actor.staffId },
      });
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'team.invite',
        entityType: 'staff_account',
        entityId: staff.id,
        changes: { after: { email, role: invite.role } },
      });
      return toView(staff);
    });
  }

  /** Cancels an invite that has not been used yet (the row is removed). */
  async cancelInvite(actor: Actor | undefined, id: string): Promise<void> {
    assertStaff(actor, 'team.manage');
    await this.transactions.run(async (tx) => {
      const staff = await tx.staffAccount.findUnique({ where: { id } });
      if (!staff) throw new NotFoundError();
      if (staff.status !== 'INVITED') {
        throw new ConflictError(
          'Only an unused invitation can be cancelled; disable the account instead',
          ErrorCode.INVALID_TRANSITION,
        );
      }
      await tx.staffAccount.delete({ where: { id } });
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'team.invite_cancel',
        entityType: 'staff_account',
        entityId: id,
        changes: { before: { email: staff.email, role: staff.role } },
      });
    });
  }

  /** Changes role and/or status (PATCH /team/{id}). */
  async update(actor: Actor | undefined, id: string, input: unknown): Promise<AdminUserView> {
    assertStaff(actor, 'team.manage');
    const change = parse(updateSchema, input);

    return this.transactions.run(async (tx) => {
      // Lock every active Super admin row first, so two concurrent demotions cannot
      // each see "another one remains" (LAST_SUPER_ADMIN).
      const activeSuperAdmins = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM app.staff_accounts WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' FOR UPDATE`;
      const staff = await tx.staffAccount.findUnique({ where: { id } });
      if (!staff) throw new NotFoundError();

      const current = { role: staff.role as StaffRole, status: staff.status };
      const next = { role: change.role ?? current.role, status: change.status ?? current.status };
      if (change.status && !canChangeStatus(current.status, change.status)) {
        throw new ConflictError(
          'An invited account becomes active only through its own first Google sign-in',
          ErrorCode.INVALID_TRANSITION,
        );
      }
      if (
        wouldRemoveLastSuperAdmin({
          current,
          next,
          otherActiveSuperAdmins: activeSuperAdmins.filter((s) => s.id !== id).length,
        })
      ) {
        throw new ConflictError('There must always be at least one active Super admin', ErrorCode.LAST_SUPER_ADMIN);
      }
      if (next.role === current.role && next.status === current.status) {
        return toView(staff);
      }

      const now = new Date();
      // Re-enabling someone who never signed in returns them to INVITED: their first
      // Google sign-in activates them, as for any invite.
      const storedStatus = next.status === 'ACTIVE' && !staff.activatedAt ? 'INVITED' : next.status;
      const updated = await tx.staffAccount.update({
        where: { id },
        data: {
          role: next.role,
          status: storedStatus,
          ...(next.status === 'DISABLED' && current.status !== 'DISABLED' ? { disabledAt: now } : {}),
          ...(next.status === 'ACTIVE' ? { disabledAt: null } : {}),
        },
      });
      if (next.status === 'DISABLED' && current.status !== 'DISABLED') {
        await this.sessions.revokeAllForStaff(tx, id, 'DISABLED');
      } else if (next.role !== current.role) {
        await this.sessions.revokeAllForStaff(tx, id, 'ROLE_CHANGED');
      }
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'team.update',
        entityType: 'staff_account',
        entityId: id,
        changes: { before: current, after: next },
      });
      return toView(updated);
    });
  }
}
