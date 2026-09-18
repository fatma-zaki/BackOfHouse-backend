import { IsEnum, IsInt, IsString, Min, Max, IsArray, IsUrl, MinLength, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Environment contract. Every value the application depends on is declared here
 * and validated at startup so that the process fails fast on misconfiguration.
 */
export class EnvVariables {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsArray()
  @IsString({ each: true })
  CORS_ORIGINS!: string[];

  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  SUPABASE_URL!: string;

  @IsString()
  @MinLength(20)
  SUPABASE_ANON_KEY!: string;

  @IsString()
  @MinLength(20)
  SUPABASE_SERVICE_ROLE_KEY!: string;

  /** Rate limit window in seconds. */
  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL!: number;

  /** Requests allowed per window, per client. */
  @IsInt()
  @Min(1)
  RATE_LIMIT_LIMIT!: number;

  @IsInt()
  @Min(1024)
  @Max(52428800)
  MAX_FILE_SIZE!: number;
}

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function toOriginList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Validates raw environment variables and returns a typed, coerced instance.
 * Throws with an aggregated message so that startup failures are actionable.
 */
export function validateEnv(config: Record<string, unknown>): EnvVariables {
  const raw = config as Record<string, string | undefined>;

  const instance = plainToInstance(EnvVariables, {
    NODE_ENV: raw['NODE_ENV'] ?? NodeEnv.Development,
    PORT: toInt(raw['PORT'], 3000),
    CORS_ORIGINS: toOriginList(raw['CORS_ORIGINS']),
    SUPABASE_URL: raw['SUPABASE_URL'] ?? '',
    SUPABASE_ANON_KEY: raw['SUPABASE_ANON_KEY'] ?? '',
    SUPABASE_SERVICE_ROLE_KEY: raw['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
    RATE_LIMIT_TTL: toInt(raw['RATE_LIMIT_TTL'], 60),
    RATE_LIMIT_LIMIT: toInt(raw['RATE_LIMIT_LIMIT'], 100),
    MAX_FILE_SIZE: toInt(raw['MAX_FILE_SIZE'], 5 * 1024 * 1024),
  });

  const errors = validateSync(instance, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    // Never echo the offending values — they may be secrets.
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }

  if (instance.NODE_ENV === NodeEnv.Production && instance.CORS_ORIGINS.length === 0) {
    throw new Error('CORS_ORIGINS must list at least one origin in production');
  }

  return instance;
}

export type ValidatedEnv = EnvVariables;
