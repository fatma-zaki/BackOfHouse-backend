import { parseCookies } from './cookies';
import { pkceChallenge, safeEqual } from '../crypto/tokens';

describe('parseCookies', () => {
  it('reads name=value pairs, first value wins, bad encoding is skipped', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('__Host-boh_admin=abc; theme=dark; theme=light; bad=%E0%A4%A')).toEqual({
      '__Host-boh_admin': 'abc',
      theme: 'dark',
    });
    expect(parseCookies('a=b%20c; =x; novalue')).toEqual({ a: 'b c' });
  });
});

describe('token helpers', () => {
  it('computes the RFC 7636 example PKCE challenge', () => {
    expect(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('compares in constant time and rejects different lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
