import { Env } from './env.schema';

/**
 * Typed, grouped view of the validated environment. Injected as a singleton;
 * nothing else in the codebase reads `process.env`.
 */
export class AppConfig {
  readonly app: {
    nodeEnv: Env['NODE_ENV'];
    appEnv: Env['APP_ENV'];
    port: number;
    publicUrl?: string;
    corsAllowedOrigins: string[];
    logLevel: Env['LOG_LEVEL'];
  };

  readonly database: {
    url: string;
    poolSize: number;
    statementTimeoutMs: number;
  };

  readonly rateLimit: { ttlMs: number; limit: number };

  readonly worker: {
    jobsEnabled: boolean;
    outboxPollIntervalMs: number;
    outboxBatchSize: number;
  };

  readonly supabase: {
    url?: string;
    jwtIssuer?: string;
    jwksUrl?: string;
    secretKey?: string;
  };

  readonly storage: {
    publicBucket: string;
    privateBucket: string;
    quarantineBucket: string;
    signedUrlTtlSeconds: number;
  };

  constructor(env: Env) {
    this.app = {
      nodeEnv: env.NODE_ENV,
      appEnv: env.APP_ENV,
      port: env.PORT,
      publicUrl: env.API_PUBLIC_URL,
      corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS,
      logLevel: env.LOG_LEVEL,
    };
    this.database = {
      url: env.DATABASE_URL,
      poolSize: env.DATABASE_POOL_SIZE,
      statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
    };
    this.rateLimit = { ttlMs: env.RATE_LIMIT_TTL_SECONDS * 1000, limit: env.RATE_LIMIT_LIMIT };
    this.worker = {
      jobsEnabled: env.JOBS_ENABLED,
      outboxPollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
      outboxBatchSize: env.OUTBOX_BATCH_SIZE,
    };
    this.supabase = {
      url: env.SUPABASE_URL,
      jwtIssuer: env.SUPABASE_JWT_ISSUER,
      jwksUrl: env.SUPABASE_JWKS_URL,
      secretKey: env.SUPABASE_SECRET_KEY,
    };
    this.storage = {
      publicBucket: env.STORAGE_BUCKET_PUBLIC,
      privateBucket: env.STORAGE_BUCKET_PRIVATE,
      quarantineBucket: env.STORAGE_BUCKET_QUARANTINE,
      signedUrlTtlSeconds: env.SIGNED_URL_TTL_SECONDS,
    };
  }

  get isProduction(): boolean {
    return this.app.appEnv === 'production';
  }
}
