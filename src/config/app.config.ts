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

  /** Forced-update policy per platform for the app surface (D11). */
  readonly appVersion: Record<
    'IOS' | 'ANDROID',
    { minSupportedVersion: string; latestVersion: string; updateUrl: string }
  >;

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
    // Store pages are placeholders for local and test only; staging and production must set them (env.schema).
    this.appVersion = {
      IOS: {
        minSupportedVersion: env.APP_IOS_MIN_SUPPORTED_VERSION,
        latestVersion: env.APP_IOS_LATEST_VERSION,
        updateUrl: env.APP_IOS_UPDATE_URL ?? 'https://apps.apple.com/',
      },
      ANDROID: {
        minSupportedVersion: env.APP_ANDROID_MIN_SUPPORTED_VERSION,
        latestVersion: env.APP_ANDROID_LATEST_VERSION,
        updateUrl: env.APP_ANDROID_UPDATE_URL ?? 'https://play.google.com/store/apps',
      },
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
