import { createPublicKey, KeyObject, verify, type JsonWebKey } from 'node:crypto';
import type { Clock } from '../clock/clock';
import { UnauthenticatedError } from '../errors';

/** Registered claims every verified token has (RFC 7519 §4.1). */
export interface JwtClaims {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
}

/** Claims of a Google ID token (OpenID Connect Core §2), used for staff sign-in. */
export interface IdTokenClaims extends JwtClaims {
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

/** Supported algorithms: the JWK key type each needs and how node:crypto checks the signature. */
const ALGORITHMS = {
  RS256: { kty: 'RSA', dsaEncoding: undefined },
  // JWS ECDSA signatures are r||s (RFC 7518 §3.4), not DER.
  ES256: { kty: 'EC', dsaEncoding: 'ieee-p1363' },
} as const;
type Algorithm = keyof typeof ALGORITHMS;

const decodeSegment = (segment: string): unknown => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

/**
 * Verifies signed JWTs (RS256 or ES256) against a JWKS endpoint with node:crypto:
 * signature, issuer, audience, expiry and issued-at (with 60 s skew). Used for
 * Google ID tokens (staff, ADR-032) and Supabase access tokens (members, ADR-003).
 * Keys are cached and refetched when a token names an unknown key id (at most
 * once a minute). Any failure is a 401; the reason goes to the log only.
 */
export class JwksIdTokenVerifier {
  private keys = new Map<string, { key: KeyObject; kty: string }>();
  private fetchedAt = 0;

  constructor(
    private readonly jwksUrl: string,
    private readonly clock: Clock,
    private readonly fetchJson: FetchJson = async (url) => (await fetch(url)).json(),
    private readonly algorithms: readonly Algorithm[] = ['RS256'],
  ) {}

  async verify<T extends JwtClaims = IdTokenClaims>(token: string, options: VerifyOptions): Promise<T> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthenticatedError('Invalid token');

    let header: { alg?: string; kid?: string };
    let claims: T;
    try {
      header = decodeSegment(parts[0]) as typeof header;
      claims = decodeSegment(parts[1]) as T;
    } catch {
      throw new UnauthenticatedError('Invalid token');
    }
    const alg = header.alg as Algorithm;
    if (!this.algorithms.includes(alg) || !header.kid) throw new UnauthenticatedError('Invalid token');

    const entry = await this.key(header.kid);
    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], 'base64url');
    const { kty, dsaEncoding } = ALGORITHMS[alg];
    if (
      !entry ||
      entry.kty !== kty ||
      !verify('sha256', signed, dsaEncoding ? { key: entry.key, dsaEncoding } : entry.key, signature)
    ) {
      throw new UnauthenticatedError('Invalid token');
    }

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
      throw new UnauthenticatedError('Invalid token');
    }
    return claims;
  }

  private async key(kid: string): Promise<{ key: KeyObject; kty: string } | undefined> {
    const now = this.clock.now().getTime();
    if (!this.keys.has(kid) && now - this.fetchedAt >= JWKS_REFRESH_MIN_MS) {
      const jwks = (await this.fetchJson(this.jwksUrl)) as { keys?: (JsonWebKey & { kid?: string })[] };
      const next = new Map<string, { key: KeyObject; kty: string }>();
      for (const jwk of jwks.keys ?? []) {
        if (jwk.kid && (jwk.kty === 'RSA' || jwk.kty === 'EC')) {
          next.set(jwk.kid, { key: createPublicKey({ key: jwk, format: 'jwk' }), kty: jwk.kty });
        }
      }
      this.keys = next;
      this.fetchedAt = now;
    }
    return this.keys.get(kid);
  }
}
