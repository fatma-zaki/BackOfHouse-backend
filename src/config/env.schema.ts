import { z } from 'zod';

/**
 * Environment contract (supabase-architecture.md §11).
 *
 * Validated once at boot; the process refuses to start on a missing or invalid
 * value. Error messages name the variable but never echo its value, because
 * several of these are secrets.
 *
 * Variables for later stages (Supabase Auth/JWKS in Stage 4, storage in
 * Stage 5, messaging in Stage 13) are optional here and become required when
 * the module that needs them is enabled.
 */

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const commaSeparated = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );

const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be a version like 1.2.3');

/** Compares two x.y.z versions numerically. */
export function compareVersions(a: string, b: string): number {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i += 1) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
}

const postgresUrl = z
  .string()
  .min(1)
  .refine((value) => /^postgres(ql)?:\/\//.test(value), 'must be a postgres:// or postgresql:// URL');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    API_PUBLIC_URL: z.string().url().optional(),
    CORS_ALLOWED_ORIGINS: commaSeparated,
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Runtime connection (api + worker). supabase-architecture.md §2.
    DATABASE_URL: postgresUrl,
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),

    // Rate limiting (security-and-audit.md §5; in-memory until TQ-16).
    RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().min(1).default(60),
    RATE_LIMIT_LIMIT: z.coerce.number().int().min(1).default(60),

    // Worker (ADR-010, ADR-011, ADR-022).
    JOBS_ENABLED: booleanString.default(false),
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(1000),
    OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),

    // App surface: forced-update policy, GET /api/app/v1/meta/app-version (D11, ADR-031).
    // Moves to settings in Phase 1; update URLs are required outside local and test.
    APP_IOS_MIN_SUPPORTED_VERSION: semver.default('1.0.0'),
    APP_IOS_LATEST_VERSION: semver.default('1.0.0'),
    APP_IOS_UPDATE_URL: z.string().url().optional(),
    APP_ANDROID_MIN_SUPPORTED_VERSION: semver.default('1.0.0'),
    APP_ANDROID_LATEST_VERSION: semver.default('1.0.0'),
    APP_ANDROID_UPDATE_URL: z.string().url().optional(),

    // Staff sign-in: Google Workspace via OIDC (ADR-032). Optional locally (sign-in then
    // answers 503); required in staging and production.
    STAFF_GOOGLE_WORKSPACE_DOMAIN: z
      .string()
      .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, 'must be a domain like example.com')
      .optional(),
    STAFF_OIDC_CLIENT_ID: z.string().min(1).optional(),
    STAFF_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
    STAFF_OIDC_REDIRECT_URI: z.string().url().optional(),
    ADMIN_WEB_URL: z.string().url().optional(),
    ADMIN_SESSION_MAX_HOURS: z.coerce.number().int().min(1).max(24).default(12),

    // Seed: the first Super admin (database-design-rules.md §16), INVITED until first sign-in.
    SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),
    SEED_SUPER_ADMIN_NAME: z.string().min(1).optional(),

    // Stage 4+ (optional until the identity and media modules are enabled).
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_JWT_ISSUER: z.string().url().optional(),
    SUPABASE_JWKS_URL: z.string().url().optional(),
    SUPABASE_SECRET_KEY: z.string().min(20).optional(),
    STORAGE_BUCKET_PUBLIC: z.string().default('public-media'),
    STORAGE_BUCKET_PRIVATE: z.string().default('private-documents'),
    STORAGE_BUCKET_QUARANTINE: z.string().default('quarantine'),
    SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  })
  .superRefine((env, ctx) => {
    for (const platform of ['IOS', 'ANDROID'] as const) {
      const min = env[`APP_${platform}_MIN_SUPPORTED_VERSION`];
      const latest = env[`APP_${platform}_LATEST_VERSION`];
      if (compareVersions(min, latest) > 0) {
        ctx.addIssue({
          code: 'custom',
          path: [`APP_${platform}_MIN_SUPPORTED_VERSION`],
          message: `must not be above APP_${platform}_LATEST_VERSION`,
        });
      }
      if ((env.APP_ENV === 'staging' || env.APP_ENV === 'production') && !env[`APP_${platform}_UPDATE_URL`]) {
        ctx.addIssue({
          code: 'custom',
          path: [`APP_${platform}_UPDATE_URL`],
          message: 'is required in staging and production',
        });
      }
    }
    if (env.APP_ENV === 'staging' || env.APP_ENV === 'production') {
      for (const key of [
        'STAFF_GOOGLE_WORKSPACE_DOMAIN',
        'STAFF_OIDC_CLIENT_ID',
        'STAFF_OIDC_CLIENT_SECRET',
        'STAFF_OIDC_REDIRECT_URI',
        'ADMIN_WEB_URL',
      ] as const) {
        if (!env[key]) {
          ctx.addIssue({ code: 'custom', path: [key], message: 'is required in staging and production (ADR-032)' });
        }
      }
    }
    if (env.APP_ENV === 'production' && env.CORS_ALLOWED_ORIGINS.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ALLOWED_ORIGINS'],
        message: 'must list at least one origin in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Parses the environment, throwing one aggregated, value-free error message. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }

  return result.data;
}
