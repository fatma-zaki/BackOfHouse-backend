import { Inject, Injectable } from '@nestjs/common';
import type { StaffActor } from '../../../common/context/actor';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { randomToken, safeEqual, sha256Hex } from '../../../common/crypto/tokens';
import { ErrorCode, ForbiddenError } from '../../../common/errors';
import { AppConfig } from '../../../config/app.config';
import { PrismaService, Tx } from '../../../platform/database';
import { SettingsService } from '../../settings';
import { permissionsForRole, StaffRole } from '../domain/permissions';

export const ADMIN_SESSION_COOKIE = '__Host-boh_admin';
export const ADMIN_CSRF_COOKIE = '__Host-boh_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Write last_seen_at at most once a minute per session. */
const TOUCH_INTERVAL_MS = 60_000;
/** Ended sessions are kept this long for investigations, then purged. */
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type RevokeReason = 'SIGN_OUT' | 'IDLE' | 'EXPIRED' | 'ROLE_CHANGED' | 'DISABLED' | 'STAFF_NOT_ACTIVE';

export interface NewSession {
  id: string;
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface SessionRequest {
  token: string | undefined;
  method: string;
  csrfHeader: string | undefined;
  csrfCookie: string | undefined;
}

/**
 * Admin web sessions (ADR-032): opaque tokens in an httpOnly cookie, stored as
 * hashes. A session ends after the idle timeout (setting, default 30 min), at its
 * absolute expiry (ADMIN_SESSION_MAX_HOURS, default 12 h), or when revoked.
 * Writes need the double-submit CSRF token.
 */
@Injectable()
export class StaffSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly config: AppConfig,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async create(tx: Tx, staffId: string, meta: { ipAddress?: string; userAgent?: string }): Promise<NewSession> {
    const token = randomToken();
    const csrfToken = randomToken();
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + this.config.staffAuth.sessionMaxHours * 60 * 60 * 1000);
    const session = await tx.adminSession.create({
      data: {
        staffId,
        tokenHash: sha256Hex(token),
        csrfTokenHash: sha256Hex(csrfToken),
        lastSeenAt: now,
        createdAt: now,
        expiresAt,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent?.slice(0, 512) ?? null,
      },
    });
    return { id: session.id, token, csrfToken, expiresAt };
  }

  /**
   * The staff actor for a session cookie, or null when there is no live session.
   * Throws 403 CSRF_TOKEN_INVALID for a write without the matching CSRF token.
   */
  async resolve(request: SessionRequest): Promise<(StaffActor & { sessionId: string }) | null> {
    if (!request.token) return null;

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: sha256Hex(request.token) },
      include: { staff: true },
    });
    if (!session || session.revokedAt) return null;

    const now = this.clock.now();
    const { admin_idle_timeout_minutes: idleMinutes } = await this.settings.current();
    if (session.expiresAt <= now) {
      await this.revoke(session.id, 'EXPIRED');
      return null;
    }
    if (session.lastSeenAt.getTime() + idleMinutes * 60_000 <= now.getTime()) {
      await this.revoke(session.id, 'IDLE');
      return null;
    }
    if (session.staff.status !== 'ACTIVE') {
      await this.revoke(session.id, 'STAFF_NOT_ACTIVE');
      return null;
    }

    if (UNSAFE_METHODS.has(request.method)) {
      const { csrfHeader, csrfCookie } = request;
      if (
        !csrfHeader ||
        !csrfCookie ||
        !safeEqual(csrfHeader, csrfCookie) ||
        !safeEqual(sha256Hex(csrfHeader), session.csrfTokenHash)
      ) {
        throw new ForbiddenError('Missing or wrong X-CSRF-Token', ErrorCode.CSRF_TOKEN_INVALID);
      }
    }

    if (now.getTime() - session.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
      await this.prisma.$transaction([
        this.prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now } }),
        this.prisma.staffAccount.update({ where: { id: session.staffId }, data: { lastActiveAt: now } }),
      ]);
    }

    const role = session.staff.role as StaffRole;
    return {
      kind: 'staff',
      staffId: session.staffId,
      role,
      permissions: permissionsForRole(role),
      sessionId: session.id,
    };
  }

  async revoke(sessionId: string, reason: RevokeReason, tx: Tx | PrismaService = this.prisma): Promise<void> {
    await tx.adminSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: this.clock.now(), revokeReason: reason },
    });
  }

  /** Ends every live session of a staff member (role change, disable). */
  async revokeAllForStaff(tx: Tx, staffId: string, reason: RevokeReason): Promise<number> {
    const { count } = await tx.adminSession.updateMany({
      where: { staffId, revokedAt: null },
      data: { revokedAt: this.clock.now(), revokeReason: reason },
    });
    return count;
  }

  /** Job `admin-auth.purge`: drops pending sign-ins past expiry and sessions ended over 30 days ago. */
  async purge(): Promise<{ states: number; sessions: number }> {
    const now = this.clock.now();
    const cutoff = new Date(now.getTime() - RETENTION_MS);
    const [states, sessions] = await this.prisma.$transaction([
      this.prisma.adminOidcState.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.adminSession.deleteMany({
        where: { OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }] },
      }),
    ]);
    return { states: states.count, sessions: sessions.count };
  }
}
