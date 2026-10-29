import { createPublicKey, KeyObject, verify, type JsonWebKey } from 'node:crypto';
import type { Clock } from '../../../common/clock/clock';
import { UnauthenticatedError } from '../../../common/errors';

/** Claims this service relies on (OpenID Connect Core §2, Google ID token). */
export interface IdTokenClaims {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  /** Google Workspace hosted domain; absent for consumer Google accounts. */
  hd?: string;
  name?: string;
}

export interface VerifyOptions {
  issuers: readonly string[];
  audience: string;
}

type FetchJson = (url: string) => Promise<unknown>;

const CLOCK_SKEW_SECONDS = 60;
const JWKS_REFRESH_MIN_MS = 60_000;

const decodeSegment = (segment: string): unknown => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

/**
 * Verifies RS256 ID tokens against a JWKS endpoint with node:crypto: signature,
 * issuer, audience, expiry and issued-at (with 60 s skew). Keys are cached and
 * refetched when a token names an unknown key id (at most once a minute).
 * Any failure is a 401; the reason goes to the log only.
 */
export class JwksIdTokenVerifier {
  private keys = new Map<string, KeyObject>();
  private fetchedAt = 0;

  constructor(
    private readonly jwksUrl: string,
    private readonly clock: Clock,
    private readonly fetchJson: FetchJson = async (url) => (await fetch(url)).json(),
  ) {}

  async verify(token: string, options: VerifyOptions): Promise<IdTokenClaims> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthenticatedError('Invalid ID token');

    let header: { alg?: string; kid?: string };
    let claims: IdTokenClaims;
    try {
      header = decodeSegment(parts[0]) as typeof header;
      claims = decodeSegment(parts[1]) as IdTokenClaims;
    } catch {
      throw new UnauthenticatedError('Invalid ID token');
    }
    if (header.alg !== 'RS256' || !header.kid) throw new UnauthenticatedError('Invalid ID token');

    const key = await this.key(header.kid);
    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], 'base64url');
    if (!key || !verify('sha256', signed, key, signature)) throw new UnauthenticatedError('Invalid ID token');

    const now = Math.floor(this.clock.now().getTime() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (
      !options.issuers.includes(claims.iss) ||
      !audiences.includes(options.audience) ||
      typeof claims.exp !== 'number' ||
      claims.exp + CLOCK_SKEW_SECONDS < now ||
      typeof claims.iat !== 'number' ||
      claims.iat - CLOCK_SKEW_SECONDS > now ||
      typeof claims.sub !== 'string'
    ) {
      throw new UnauthenticatedError('Invalid ID token');
    }
    return claims;
  }

  private async key(kid: string): Promise<KeyObject | undefined> {
    const now = this.clock.now().getTime();
    if (!this.keys.has(kid) && now - this.fetchedAt >= JWKS_REFRESH_MIN_MS) {
      const jwks = (await this.fetchJson(this.jwksUrl)) as { keys?: (JsonWebKey & { kid?: string })[] };
      const next = new Map<string, KeyObject>();
      for (const jwk of jwks.keys ?? []) {
        if (jwk.kid && jwk.kty === 'RSA') {
          next.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
        }
      }
      this.keys = next;
      this.fetchedAt = now;
    }
    return this.keys.get(kid);
  }
}
