import { parseEnv } from './env.schema';

const base = { DATABASE_URL: 'postgresql://boh_app:secret-value@db.example.test:5432/postgres' };

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(base);
    expect(env).toMatchObject({ NODE_ENV: 'development', APP_ENV: 'local', PORT: 3000, JOBS_ENABLED: false });
    expect(env.CORS_ALLOWED_ORIGINS).toEqual([]);
  });

  it('splits the CORS allow-list', () => {
    expect(
      parseEnv({ ...base, CORS_ALLOWED_ORIGINS: 'https://a.test, https://b.test ,' }).CORS_ALLOWED_ORIGINS,
    ).toEqual(['https://a.test', 'https://b.test']);
  });

  it('fails fast without DATABASE_URL', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it('never echoes secret values in the error', () => {
    try {
      parseEnv({ DATABASE_URL: 'mysql://user:hunter2@host/db' });
      throw new Error('expected parseEnv to throw');
    } catch (error) {
      expect((error as Error).message).toMatch(/DATABASE_URL/);
      expect((error as Error).message).not.toContain('hunter2');
    }
  });

  it('requires CORS origins in production', () => {
    expect(() => parseEnv({ ...base, APP_ENV: 'production' })).toThrow(/CORS_ALLOWED_ORIGINS/);
  });

  it('rejects an invalid boolean', () => {
    expect(() => parseEnv({ ...base, JOBS_ENABLED: 'yes' })).toThrow(/JOBS_ENABLED/);
  });
});
