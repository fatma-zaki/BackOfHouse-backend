/**
 * The member credential store (ADR-003 amended: Supabase Auth behind the API's
 * /auth/* routes). A port so local runs and tests work without a Supabase project.
 * Passwords and refresh tokens live only in the provider; the API keeps `users`.
 */
export interface AuthTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds (contracts/app `Session.expires_in`). */
  expiresIn: number;
}

/** A verified access token. */
export interface VerifiedAccess {
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface MemberAuthProvider {
  /** Creates the credential. Returns null when the email already has one. */
  createUser(input: { email: string; password: string }): Promise<{ userId: string } | null>;
  /** Removes a credential created moments ago when the API could not finish registration. */
  deleteUser(userId: string): Promise<void>;
  /** Null for a wrong email or password. */
  signInWithPassword(email: string, password: string): Promise<AuthTokens | null>;
  /** A new session for an account the API has already authenticated (phone code). */
  createSession(user: { userId: string; email: string }): Promise<AuthTokens>;
  /** Null for an unknown, used or revoked refresh token. */
  refresh(refreshToken: string): Promise<AuthTokens | null>;
  /** Ends the session of this access token (its refresh token stops working). */
  signOut(accessToken: string): Promise<void>;
  /** Throws UnauthenticatedError for anything but a valid, unexpired token. */
  verifyAccessToken(accessToken: string): Promise<VerifiedAccess>;
  /** Emails a reset link to an existing account. */
  sendPasswordReset(email: string): Promise<void>;
  /** Sets the password from a reset token and ends every session. Null for a bad or expired token. */
  resetPassword(token: string, password: string): Promise<{ userId: string } | null>;
}

export const MEMBER_AUTH_PROVIDER = Symbol('MEMBER_AUTH_PROVIDER');
