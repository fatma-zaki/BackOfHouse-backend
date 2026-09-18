import { scrubSecrets } from './scrub-secrets';

describe('scrubSecrets', () => {
  it.each([
    ['connect to postgres://user:hunter2@db:5432/app failed', 'postgres://user:[REDACTED]@db:5432/app'],
    ['Authorization: Bearer eyJhbGciOi.payload.sig', 'Bearer [REDACTED]'],
    ['password=hunter2 rejected', 'password=[REDACTED]'],
    ['api_key: abc123', 'api_key: [REDACTED]'],
  ])('scrubs %p', (input, expected) => {
    const result = scrubSecrets(input);
    expect(result).toContain(expected);
    expect(result).not.toMatch(/hunter2|eyJhbGciOi|abc123/);
  });

  it('leaves ordinary text alone', () => {
    expect(scrubSecrets('duplicate key value violates unique constraint')).toBe(
      'duplicate key value violates unique constraint',
    );
  });
});
