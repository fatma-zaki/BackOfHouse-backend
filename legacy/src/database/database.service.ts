import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig, getAppConfig } from '../config/configuration';

/**
 * Owns the Supabase clients.
 *
 * - `admin` uses the service-role key. It bypasses RLS and therefore must only
 *   ever be reachable from this server process, behind explicit authorization
 *   checks in the domain services.
 * - `anon` and `forUser()` use the public anon key and are subject to RLS. They
 *   are used for auth flows and for operations we deliberately want the
 *   database to re-authorize.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private adminClient: SupabaseClient | null = null;
  private anonClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const { url, anonKey, serviceRoleKey } = this.supabaseConfig;

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.logger.log('Supabase clients initialised');
  }

  /** Service-role client. Bypasses RLS — never expose its key or results blindly. */
  get admin(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('DatabaseService has not been initialised');
    }
    return this.adminClient;
  }

  /** Anonymous client used for password-based auth flows. Subject to RLS. */
  get anon(): SupabaseClient {
    if (!this.anonClient) {
      throw new Error('DatabaseService has not been initialised');
    }
    return this.anonClient;
  }

  /**
   * Builds a client that acts as the end user, so RLS applies as a second
   * line of defence. Used for operations performed on the caller's behalf.
   */
  forUser(accessToken: string): SupabaseClient {
    const { url, anonKey } = this.supabaseConfig;
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  private get supabaseConfig(): AppConfig['supabase'] {
    return getAppConfig((key) => this.configService.get<AppConfig>(key)).supabase;
  }
}
