import { parseCookies } from './cookies';
import { pkceChallenge, safeEqual } from '../crypto/tokens';

describe('parseCookies', () => {
  it('reads name=value pairs, first value wins, bad encoding is skipped', () => {
    expect(parseCookies(undefined)).toEqual(new Map());
    expect(parseCookies('__Host-boh_admin=abc; theme=dark; theme=light; bad=%E0%A4%A')).toEqual(
      new Map([
        ['__Host-boh_admin', 'abc'],
        ['theme', 'dark'],
      ]),
    );
    expect(parseCookies('a=b%20c; =x; novalue')).toEqual(new Map([['a', 'b c']]));
  });

  it('cannot pollute object prototypes with client-chosen names', () => {
    const cookies = parseCookies('__proto__=polluted; constructor=x; prototype=y');
    expect(cookies.get('__proto__')).toBe('polluted');
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
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
