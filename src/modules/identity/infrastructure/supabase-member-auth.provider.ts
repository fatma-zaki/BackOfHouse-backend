import { Logger } from '@nestjs/common';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Clock } from '../../../common/clock/clock';
import { JwksIdTokenVerifier, JwtClaims } from '../../../common/crypto/jwks-verifier';
import { AuthTokens, MemberAuthProvider, VerifiedAccess } from './member-auth-provider';

export interface SupabaseAuthConfig {
  url: string;
  secretKey: string;
  /** Defaults to `${url}/auth/v1`. */
  issuer?: string;
  /** Defaults to `${issuer}/.well-known/jwks.json`. */
  jwksUrl?: string;
  /** Website page that receives `?token=` and calls POST /auth/reset-password. */
  passwordResetUrl?: string;
}

interface SupabaseAccessClaims extends JwtClaims {
  session_id?: string;
}

/**
 * Supabase Auth behind the API (ADR-003 option b). Uses the server secret key, which
 * never leaves this process. Access tokens are verified locally against the project's
 * JWKS (asymmetric signing keys, supabase-architecture.md §8.1).
 *
 * Calls that start a session (password, refresh, OTP verify) use a fresh client, so
 * no session state is shared between requests.
 *
 * Setup the email templates need: the recovery email links to
 * `{{ .RedirectTo }}?token={{ .TokenHash }}`.
 */
export class SupabaseMemberAuthProvider implements MemberAuthProvider {
  private readonly logger = new Logger(SupabaseMemberAuthProvider.name);
  private readonly admin: SupabaseClient;
  private readonly verifier: JwksIdTokenVerifier;
  private readonly issuer: string;

  constructor(
    private readonly config: SupabaseAuthConfig,
    clock: Clock,
  ) {
    this.admin = this.client();
    this.issuer = config.issuer ?? `${config.url.replace(/\/$/, '')}/auth/v1`;
    this.verifier = new JwksIdTokenVerifier(
      config.jwksUrl ?? `${this.issuer}/.well-known/jwks.json`,
      clock,
      undefined,
      ['ES256', 'RS256'],
    );
  }

  async createUser({ email, password }: { email: string; password: string }): Promise<{ userId: string } | null> {
    // The contract signs the user in straight after registration, so the email is not
    // confirmed by a code first (open question BQ-82); users.email_verified_at stays null.
    const { data, error } = await this.admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error?.code === 'email_exists' || error?.code === 'user_already_exists') return null;
    if (error || !data.user) throw new Error(`Supabase createUser failed: ${error?.code ?? 'no user'}`);
    return { userId: data.user.id };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.admin.auth.admin.deleteUser(userId);
    if (error) this.logger.error(`Could not remove auth user ${userId} after a failed registration: ${error.code}`);
  }

  async signInWithPassword(email: string, password: string): Promise<AuthTokens | null> {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    if (error?.code === 'invalid_credentials' || error?.status === 400) return null;
    if (error || !data.session) throw new Error(`Supabase sign-in failed: ${error?.code ?? 'no session'}`);
    return this.tokens(data.session);
  }

  /** Mints a session through a one-time magic-link token that never leaves the server. */
  async createSession({ email }: { userId: string; email: string }): Promise<AuthTokens> {
    const { data: link, error } = await this.admin.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = link?.properties?.hashed_token;
    if (error || !tokenHash) throw new Error(`Supabase generateLink failed: ${error?.code ?? 'no token'}`);
    const { data, error: verifyError } = await this.client().auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });
    if (verifyError || !data.session) throw new Error(`Supabase verifyOtp failed: ${verifyError?.code ?? 'none'}`);
    return this.tokens(data.session);
  }

  async refresh(refreshToken: string): Promise<AuthTokens | null> {
    const { data, error } = await this.client().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return null;
    return this.tokens(data.session);
  }

  async signOut(accessToken: string): Promise<void> {
    const { error } = await this.admin.auth.admin.signOut(accessToken, 'local');
    if (error) this.logger.warn(`Supabase signOut failed: ${error.code}`);
  }

  async verifyAccessToken(accessToken: string): Promise<VerifiedAccess> {
    const claims = await this.verifier.verify<SupabaseAccessClaims>(accessToken, {
      issuers: [this.issuer],
      audience: 'authenticated',
    });
    return {
      userId: claims.sub,
      // Older tokens without session_id can only be revoked by expiry.
      sessionId: claims.session_id ?? `sub:${claims.sub}:${claims.iat}`,
      issuedAt: new Date(claims.iat * 1000),
      expiresAt: new Date(claims.exp * 1000),
    };
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.admin.auth.resetPasswordForEmail(email, {
      redirectTo: this.config.passwordResetUrl,
    });
    if (error) this.logger.warn(`Supabase resetPasswordForEmail failed: ${error.code}`);
  }

  async resetPassword(token: string, password: string): Promise<{ userId: string } | null> {
    const { data, error } = await this.client().auth.verifyOtp({ token_hash: token, type: 'recovery' });
    if (error || !data.user || !data.session) return null;
    const { error: updateError } = await this.admin.auth.admin.updateUserById(data.user.id, { password });
    if (updateError) throw new Error(`Supabase password update failed: ${updateError.code}`);
    // Ends every session of the user, including the one the reset token opened.
    await this.admin.auth.admin.signOut(data.session.access_token, 'global');
    return { userId: data.user.id };
  }

  private tokens(session: Session): AuthTokens {
    return {
      userId: session.user.id,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    };
  }

  private client(): SupabaseClient {
    return createClient(this.config.url, this.config.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
}
