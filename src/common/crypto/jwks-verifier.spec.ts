import { generateKeyPairSync, sign, KeyObject } from 'node:crypto';
import { JwksIdTokenVerifier } from './jwks-verifier';

const ISSUER = 'https://accounts.google.com';
const AUDIENCE = 'client-123.apps.googleusercontent.com';

function keyPair(kid: string): { kid: string; privateKey: KeyObject; jwk: object } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { kid, privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}

function token(privateKey: KeyObject, kid: string, claims: object, alg = 'RS256'): string {
  const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const body = `${enc({ alg, kid, typ: 'JWT' })}.${enc(claims)}`;
  return `${body}.${sign('sha256', Buffer.from(body), privateKey).toString('base64url')}`;
}

describe('JwksIdTokenVerifier', () => {
  const now = new Date('2026-10-29T10:00:00Z');
  const nowSeconds = now.getTime() / 1000;
  const clock = { now: () => now };
  const google = keyPair('k1');
  const other = keyPair('k2');
  const claims = { iss: ISSUER, aud: AUDIENCE, sub: '1', iat: nowSeconds - 10, exp: nowSeconds + 3600 };
  let fetches = 0;
  const verifier = () =>
    new JwksIdTokenVerifier('https://example/jwks', clock, async () => {
      fetches += 1;
      return { keys: [google.jwk] };
    });
  const options = { issuers: [ISSUER], audience: AUDIENCE };

  beforeEach(() => {
    fetches = 0;
  });

  it('accepts a valid token and caches the keys', async () => {
    const v = verifier();
    await expect(v.verify(token(google.privateKey, 'k1', claims), options)).resolves.toMatchObject({ sub: '1' });
    await v.verify(token(google.privateKey, 'k1', claims), options);
    expect(fetches).toBe(1);
  });

  it.each([
    ['a token signed by another key', () => token(other.privateKey, 'k1', claims)],
    ['an unknown key id', () => token(other.privateKey, 'k2', claims)],
    ['alg none', () => token(google.privateKey, 'k1', claims, 'none')],
    ['another issuer', () => token(google.privateKey, 'k1', { ...claims, iss: 'https://evil.example' })],
    ['another audience', () => token(google.privateKey, 'k1', { ...claims, aud: 'someone-else' })],
    ['an expired token', () => token(google.privateKey, 'k1', { ...claims, exp: nowSeconds - 120 })],
    ['a token issued in the future', () => token(google.privateKey, 'k1', { ...claims, iat: nowSeconds + 600 })],
    ['garbage', () => 'not-a-jwt'],
  ])('rejects %s with 401', async (_label, make) => {
    await expect(verifier().verify(make(), options)).rejects.toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });
  });

  it('accepts an audience list that contains the client id', async () => {
    const t = token(google.privateKey, 'k1', { ...claims, aud: ['x', AUDIENCE] });
    await expect(verifier().verify(t, options)).resolves.toBeDefined();
  });

  describe('ES256 (Supabase access tokens)', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const ecJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'e1', alg: 'ES256' };
    const esToken = (claimsOverride: object = {}) => {
      const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64url');
      const body = `${enc({ alg: 'ES256', kid: 'e1', typ: 'JWT' })}.${enc({ ...claims, ...claimsOverride })}`;
      const signature = sign('sha256', Buffer.from(body), { key: privateKey, dsaEncoding: 'ieee-p1363' });
      return `${body}.${signature.toString('base64url')}`;
    };
    const esVerifier = (algorithms: ('RS256' | 'ES256')[]) =>
      new JwksIdTokenVerifier('https://example/jwks', clock, async () => ({ keys: [ecJwk, google.jwk] }), algorithms);

    it('accepts a valid ES256 token when ES256 is allowed', async () => {
      await expect(esVerifier(['ES256']).verify(esToken(), options)).resolves.toMatchObject({ sub: '1' });
    });

    it('refuses ES256 when only RS256 is allowed, and an RSA key presented as ES256', async () => {
      await expect(esVerifier(['RS256']).verify(esToken(), options)).rejects.toMatchObject({ status: 401 });
      const forged = token(google.privateKey, 'k1', claims, 'ES256');
      await expect(esVerifier(['ES256', 'RS256']).verify(forged, options)).rejects.toMatchObject({ status: 401 });
    });
  });
});
