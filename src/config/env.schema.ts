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
