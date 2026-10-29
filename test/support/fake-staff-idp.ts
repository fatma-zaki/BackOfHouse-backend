import type { Clock } from '../../src/common/clock/clock';
import type { IdTokenClaims, StaffIdentityProvider } from '../../src/modules/access';

/**
 * Fake Google for e2e tests. `authorizationUrl` records the state and nonce the
 * API generated; `exchangeCode` returns the claims registered for a code. Unless a
 * test overrides it, the nonce in the claims is the one the API sent.
 */
export class FakeStaffIdp implements StaffIdentityProvider {
  lastNonce = '';
  private readonly codes = new Map<string, Partial<IdTokenClaims>>();

  authorizationUrl({ state, nonce }: { state: string; nonce: string; codeChallenge: string }): string {
    this.lastNonce = nonce;
    return `https://idp.test/authorize?state=${encodeURIComponent(state)}`;
  }

  /** Registers what Google "says" for a code. */
  willReturn(code: string, claims: Partial<IdTokenClaims>): void {
    this.codes.set(code, claims);
  }

  async exchangeCode({ code }: { code: string; codeVerifier: string }): Promise<IdTokenClaims> {
    const claims = this.codes.get(code);
    if (!claims) throw new Error(`no claims registered for ${code}`);
    return {
      iss: 'https://accounts.google.com',
      aud: 'client',
      sub: claims.email ?? 'sub',
      exp: 0,
      iat: 0,
      nonce: this.lastNonce,
      email_verified: true,
      ...claims,
    };
  }
}

/** A clock tests can move forward. */
export class FakeClock implements Clock {
  private current = new Date('2026-10-29T08:00:00Z');

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
