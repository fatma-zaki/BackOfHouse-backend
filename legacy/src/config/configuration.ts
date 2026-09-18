import { registerAs } from '@nestjs/config';
import { NodeEnv, validateEnv } from './env.validation';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  /** Server-side only. Never expose to the mobile app or any client. */
  serviceRoleKey: string;
}

export interface RateLimitConfig {
  /** Window length in milliseconds (Throttler expects milliseconds). */
  ttlMs: number;
  limit: number;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  corsOrigins: string[];
  supabase: SupabaseConfig;
  rateLimit: RateLimitConfig;
  maxFileSize: number;
}

export const APP_CONFIG_NAMESPACE = 'app';

/**
 * Builds the typed application configuration from the validated environment.
 * Registered under a namespace so consumers read `ConfigService.get<AppConfig>('app')`.
 */
export const configuration = registerAs<AppConfig>(APP_CONFIG_NAMESPACE, () => {
  const env = validateEnv(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS,
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    rateLimit: {
      ttlMs: env.RATE_LIMIT_TTL * 1000,
      limit: env.RATE_LIMIT_LIMIT,
    },
    maxFileSize: env.MAX_FILE_SIZE,
  };
});

/** Reads the namespaced config, throwing if the module was not initialised. */
export function getAppConfig(get: (key: string) => AppConfig | undefined): AppConfig {
  const config = get(APP_CONFIG_NAMESPACE);
  if (!config) {
    throw new Error('Application configuration is not available');
  }
  return config;
}
