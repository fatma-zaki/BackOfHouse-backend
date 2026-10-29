import { HttpStatus } from '@nestjs/common';
import type { Clock } from '../../../common/clock/clock';
import { DomainError, ErrorCode, UnauthenticatedError } from '../../../common/errors';
import { IdTokenClaims, JwksIdTokenVerifier } from '../../../common/crypto/jwks-verifier';

/**
 * The staff identity provider (ADR-032: Google Workspace via OIDC). A port so
 * tests can use a fake IdP; the sign-in service checks nonce, domain and staff.
 */
export interface StaffIdentityProvider {
  /** URL to send the browser to (authorization code flow with PKCE). */
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): string;
  /** Exchanges the code and returns verified ID-token claims. */
  exchangeCode(input: { code: string; codeVerifier: string }): Promise<IdTokenClaims>;
}

export const STAFF_IDENTITY_PROVIDER = Symbol('STAFF_IDENTITY_PROVIDER');

const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export interface GoogleOidcConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  workspaceDomain: string;
}

export class GoogleStaffIdentityProvider implements StaffIdentityProvider {
  private readonly verifier: JwksIdTokenVerifier;

  constructor(
    private readonly config: GoogleOidcConfig,
    clock: Clock,
  ) {
    this.verifier = new JwksIdTokenVerifier(GOOGLE_JWKS, clock);
  }

  authorizationUrl({ state, nonce, codeChallenge }: { state: string; nonce: string; codeChallenge: string }): string {
    const url = new URL(GOOGLE_AUTHORIZE);
    url.search = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      // A hint for the account chooser only; the domain is enforced on the ID token.
      hd: this.config.workspaceDomain,
      prompt: 'select_account',
    }).toString();
    return url.toString();
  }

  async exchangeCode({ code, codeVerifier }: { code: string; codeVerifier: string }): Promise<IdTokenClaims> {
    const response = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!response.ok) {
      throw new UnauthenticatedError('Google sign-in failed');
    }
    const body = (await response.json()) as { id_token?: string };
    if (!body.id_token) {
      throw new UnauthenticatedError('Google sign-in failed');
    }
    return this.verifier.verify(body.id_token, { issuers: GOOGLE_ISSUERS, audience: this.config.clientId });
  }
}

/** Used when the STAFF_OIDC_* variables are not set (local only; required elsewhere). */
export class NotConfiguredStaffIdentityProvider implements StaffIdentityProvider {
  private fail(): never {
    throw new DomainError(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Staff sign-in is not configured (STAFF_OIDC_* variables)',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  authorizationUrl(): string {
    return this.fail();
  }

  async exchangeCode(): Promise<IdTokenClaims> {
    return this.fail();
  }
}
