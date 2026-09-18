import { decodeCursor, encodeCursor } from './cursor';
import { ValidationFailedError } from '../errors';

describe('cursor', () => {
  const keys = ['created_at', 'id'];

  it('round-trips a keyset position', () => {
    const payload = { created_at: '2026-09-18T10:00:00.000Z', id: '0192f7a1-0000-7000-8000-000000000001' };
    expect(decodeCursor(encodeCursor(payload), keys)).toEqual(payload);
  });

  it.each([
    ['not base64url', '***'],
    ['not JSON', Buffer.from('nope').toString('base64url')],
    ['an array', encodeCursor({}).replace(/.*/, Buffer.from('[1]').toString('base64url'))],
    ['missing keys', encodeCursor({ id: 'x' })],
    ['extra keys', encodeCursor({ created_at: 'a', id: 'b', role: 'admin' })],
    ['too long', 'a'.repeat(600)],
  ])('rejects %s', (_label, cursor) => {
    expect(() => decodeCursor(cursor, keys)).toThrow(ValidationFailedError);
  });

  it('rejects nested values', () => {
    const cursor = Buffer.from(JSON.stringify({ created_at: { $gt: '' }, id: 'x' })).toString('base64url');
    expect(() => decodeCursor(cursor, keys)).toThrow(ValidationFailedError);
  });
});
