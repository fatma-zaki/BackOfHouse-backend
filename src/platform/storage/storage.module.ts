import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AppConfig } from '../../config/app.config';
import { STORAGE_PORT, StoragePort } from './storage.port';
import { SupabaseStorageAdapter } from './supabase-storage.adapter';

/**
 * Provides STORAGE_PORT. Imported by the media module (Stage 5). Resolving the
 * port without SUPABASE_URL and SUPABASE_SECRET_KEY fails at boot, so a
 * misconfigured deployment never starts accepting uploads.
 */
@Module({
  providers: [
    {
      provide: STORAGE_PORT,
      inject: [AppConfig],
      useFactory: (config: AppConfig): StoragePort => {
        const { url, secretKey } = config.supabase;
        if (!url || !secretKey) {
          throw new Error('Storage requires SUPABASE_URL and SUPABASE_SECRET_KEY');
        }
        const client = createClient(url, secretKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        return new SupabaseStorageAdapter(client);
      },
    },
  ],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
