import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import type { StaffActor } from '../../../common/context/actor';
import { pkceChallenge, randomToken, safeEqual, sha256Hex } from '../../../common/crypto/tokens';
import { DomainError, ErrorCode, ForbiddenError, UnauthenticatedError } from '../../../common/errors';
import { AppConfig } from '../../../config/app.config';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditLogger, auditActorOf, SYSTEM_ACTOR } from '../../audit';
import { permissionsForRole, StaffRole } from '../domain/permissions';
import { isWorkspaceEmail, normalizeEmail } from '../domain/staff';
import { STAFF_IDENTITY_PROVIDER, StaffIdentityProvider } from '../infrastructure/staff-identity-provider';
import { NewSession, StaffSessionsService } from './staff-sessions.service';

const STATE_TTL_MS = 10 * 60 * 1000;
const SAFE_RETURN_TO = /^\/(?![/\\])[^\s]{0,511}$/;

export interface SignInResult extends NewSession {
  staffId: string;
  returnTo: string;
}

export type DenyReason = 'DOMAIN' | 'EMAIL_NOT_VERIFIED' | 'NO_STAFF_ACCOUNT' | 'DISABLED';

/**
 * Staff sign-in with Google Workspace (ADR-032). `start` stores the pending
 * sign-in server-side and returns Google's URL; `complete` verifies the callback:
 * single-use state, nonce, `hd` AND email domain equal to the Workspace domain,
 * a verified email, and an INVITED or ACTIVE staff account (INVITED is activated).
 * Every sign-in and every refusal is audited.
 */
@Injectable()
export class StaffSignInService {
  private readonly logger = new Logger(StaffSignInService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly sessions: StaffSessionsService,
    private readonly config: AppConfig,
    @Inject(STAFF_IDENTITY_PROVIDER) private readonly provider: StaffIdentityProvider,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Returns the Google authorization URL. `returnTo` must be a path in the admin web app. */
  async start(returnTo: string | undefined): Promise<string> {
    this.requireWorkspaceDomain();
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = randomToken(48);
    const now = this.clock.now();
    await this.prisma.adminOidcState.create({
      data: {
        stateHash: sha256Hex(state),
        nonce,
        codeVerifier,
        returnTo: returnTo && SAFE_RETURN_TO.test(returnTo) ? returnTo : '/',
        createdAt: now,
        expiresAt: new Date(now.getTime() + STATE_TTL_MS),
      },
    });
    return this.provider.authorizationUrl({ state, nonce, codeChallenge: pkceChallenge(codeVerifier) });
  }

  async complete(input: {
    code: string;
    state: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SignInResult> {
    const domain = this.requireWorkspaceDomain();

    // Single use: the pending sign-in is deleted whether or not the rest succeeds.
    const pending = await this.prisma.$transaction(async (tx) => {
      const row = await tx.adminOidcState.findUnique({ where: { stateHash: sha256Hex(input.state) } });
      if (row) await tx.adminOidcState.delete({ where: { id: row.id } });
      return row;
    });
    if (!pending || pending.expiresAt <= this.clock.now()) {
      throw new UnauthenticatedError('Sign-in expired or invalid; start again');
    }

    const claims = await this.provider.exchangeCode({ code: input.code, codeVerifier: pending.codeVerifier });
    if (!claims.nonce || !safeEqual(claims.nonce, pending.nonce)) {
      throw new UnauthenticatedError('Sign-in expired or invalid; start again');
    }

    const email = normalizeEmail(claims.email ?? '');
    const deny = async (reason: DenyReason): Promise<never> => {
      await this.transactions.run(() =>
        this.audit.record({
          actor: SYSTEM_ACTOR,
          action: 'admin.sign_in_denied',
          entityType: 'admin_oidc_state',
          entityId: pending.id,
          changes: { after: { email, reason } },
        }),
      );
      this.logger.warn(`Staff sign-in refused (${reason})`);
      throw new ForbiddenError('This Google account is not a Back of House staff account', ErrorCode.NOT_STAFF);
    };

    if (claims.hd?.toLowerCase() !== domain || !isWorkspaceEmail(email, domain)) return deny('DOMAIN');
    if (claims.email_verified !== true) return deny('EMAIL_NOT_VERIFIED');

    const staff = await this.prisma.staffAccount.findUnique({ where: { email } });
    if (!staff) return deny('NO_STAFF_ACCOUNT');
    if (staff.status === 'DISABLED') return deny('DISABLED');

    const now = this.clock.now();
    return this.transactions.run(async (tx) => {
      const activated = staff.status === 'INVITED';
      await tx.staffAccount.update({
        where: { id: staff.id },
        data: {
          status: 'ACTIVE',
          ...(activated ? { activatedAt: now } : {}),
          lastSignInAt: now,
          lastActiveAt: now,
        },
      });
      const session = await this.sessions.create(tx, staff.id, input);
      const role = staff.role as StaffRole;
      await this.audit.record({
        actor: auditActorOf({ kind: 'staff', staffId: staff.id, role, permissions: permissionsForRole(role) }),
        action: 'admin.sign_in',
        entityType: 'staff_account',
        entityId: staff.id,
        changes: activated ? { before: { status: 'INVITED' }, after: { status: 'ACTIVE' } } : undefined,
      });
      return { ...session, staffId: staff.id, returnTo: pending.returnTo };
    });
  }

  /** Ends the caller's session (POST /auth/logout), audited as `admin.sign_out`. */
  async signOut(actor: StaffActor, sessionId: string): Promise<void> {
    await this.transactions.run(async (tx) => {
      await this.sessions.revoke(sessionId, 'SIGN_OUT', tx);
      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'admin.sign_out',
        entityType: 'staff_account',
        entityId: actor.staffId,
      });
    });
  }

  private requireWorkspaceDomain(): string {
    const domain = this.config.staffAuth.workspaceDomain;
    if (!domain) {
      throw new DomainError(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Staff sign-in is not configured (STAFF_GOOGLE_WORKSPACE_DOMAIN)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return domain.toLowerCase();
  }
}
