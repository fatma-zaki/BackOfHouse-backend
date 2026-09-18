import { REDACTED, maskEmail, maskPhone, redact } from './redact';

describe('redact', () => {
  it('drops secrets at any depth', () => {
    const result = redact({
      password: 'hunter2',
      nested: { refresh_token: 'rt', Authorization: 'Bearer x', api_key: 'k', ok: 'visible' },
      list: [{ client_secret: 's' }],
    });

    expect(result).toEqual({
      password: REDACTED,
      nested: { refresh_token: REDACTED, Authorization: REDACTED, api_key: REDACTED, ok: 'visible' },
      list: [{ client_secret: REDACTED }],
    });
  });

  it('masks emails and phone numbers', () => {
    expect(redact({ email: 'owner@example.test', contact_phone: '+966 50 123 4567' })).toEqual({
      email: 'o***@example.test',
      contact_phone: '***67',
    });
  });

  it('serialises dates and drops non-JSON values', () => {
    expect(redact({ at: new Date('2026-09-18T00:00:00Z'), fn: () => 1 })).toEqual({
      at: '2026-09-18T00:00:00.000Z',
      fn: REDACTED,
    });
  });

  it('stops at a maximum depth', () => {
    let deep: Record<string, unknown> = { value: 'bottom' };
    for (let index = 0; index < 20; index += 1) {
      deep = { next: deep };
    }
    expect(JSON.stringify(redact(deep))).toContain(REDACTED);
  });

  it('masks malformed values safely', () => {
    expect(maskEmail('no-at-sign')).toBe(REDACTED);
    expect(maskPhone('12')).toBe(REDACTED);
  });
});
