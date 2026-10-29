import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Clock } from '../../../common/clock/clock';
import { randomToken } from '../../../common/crypto/tokens';
import { UnauthenticatedError } from '../../../common/errors';
import { AuthTokens, MemberAuthProvider, VerifiedAccess } from './member-auth-provider';

const ACCESS_TTL_SECONDS = 600;
const RESET_TTL_MS = 60 * 60_000;

interface Credential {
  userId: string;
  email: string;
  salt: string;
  hash: Buffer;
}

interface Session {
  sessionId: string;
  userId: string;
  refreshToken: string;
}

/**
 * Member credentials in process memory, for APP_ENV local and test only (the env
 * schema requires Supabase in staging and production). State is lost on restart.
 * Reset links are kept in `sentResetLinks` instead of being emailed.
 */
export class InMemoryMemberAuthProvider implements MemberAuthProvider {
  readonly sentResetLinks: { email: string; token: string }[] = [];
  private readonly credentials = new Map<string, Credential>();
  private readonly sessions = new Map<string, Session>();
  private readonly accessTokens = new Map<string, VerifiedAccess>();
  private readonly resetTokens = new Map<string, { userId: string; expiresAt: number }>();

  constructor(private readonly clock: Clock) {}

  /** Forgets every credential, session and reset link (tests reset it with the database). */
  clear(): void {
    this.sentResetLinks.length = 0;
    this.credentials.clear();
    this.sessions.clear();
    this.accessTokens.clear();
    this.resetTokens.clear();
  }

  async createUser({ email, password }: { email: string; password: string }): Promise<{ userId: string } | null> {
    if (this.byEmail(email)) return null;
    const userId = randomUUID();
    const salt = randomToken(16);
    this.credentials.set(userId, { userId, email, salt, hash: scryptSync(password, salt, 32) });
    return { userId };
  }

  async deleteUser(userId: string): Promise<void> {
    this.credentials.delete(userId);
    for (const [id, session] of this.sessions) if (session.userId === userId) this.sessions.delete(id);
  }

  async signInWithPassword(email: string, password: string): Promise<AuthTokens | null> {
    const credential = this.byEmail(email);
    if (!credential || !timingSafeEqual(scryptSync(password, credential.salt, 32), credential.hash)) return null;
    return this.issue(credential.userId, randomUUID());
  }

  async createSession({ userId }: { userId: string; email: string }): Promise<AuthTokens> {
    return this.issue(userId, randomUUID());
  }

  async refresh(refreshToken: string): Promise<AuthTokens | null> {
    const session = [...this.sessions.values()].find((s) => s.refreshToken === refreshToken);
    if (!session) return null;
    return this.issue(session.userId, session.sessionId);
  }

  async signOut(accessToken: string): Promise<void> {
    const access = this.accessTokens.get(accessToken);
    if (access) this.sessions.delete(access.sessionId);
  }

  async verifyAccessToken(accessToken: string): Promise<VerifiedAccess> {
    const access = this.accessTokens.get(accessToken);
    if (!access || access.expiresAt.getTime() <= this.clock.now().getTime()) {
      throw new UnauthenticatedError('Invalid access token');
    }
    return access;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const credential = this.byEmail(email);
    if (!credential) return;
    const token = randomToken();
    this.resetTokens.set(token, { userId: credential.userId, expiresAt: this.clock.now().getTime() + RESET_TTL_MS });
    this.sentResetLinks.push({ email, token });
  }

  async resetPassword(token: string, password: string): Promise<{ userId: string } | null> {
    const reset = this.resetTokens.get(token);
    this.resetTokens.delete(token);
    const credential = reset && this.credentials.get(reset.userId);
    if (!reset || !credential || reset.expiresAt <= this.clock.now().getTime()) return null;
    credential.salt = randomToken(16);
    credential.hash = scryptSync(password, credential.salt, 32);
    for (const [id, session] of this.sessions) if (session.userId === reset.userId) this.sessions.delete(id);
    return { userId: reset.userId };
  }

  private byEmail(email: string): Credential | undefined {
    return [...this.credentials.values()].find((c) => c.email === email);
  }

  /** New access token; the refresh token rotates on every use. */
  private issue(userId: string, sessionId: string): AuthTokens {
    const now = this.clock.now();
    const accessToken = `dev.${randomToken()}`;
    const refreshToken = randomToken();
    this.sessions.set(sessionId, { sessionId, userId, refreshToken });
    this.accessTokens.set(accessToken, {
      userId,
      sessionId,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ACCESS_TTL_SECONDS * 1000),
    });
    return { userId, accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
  }
}
