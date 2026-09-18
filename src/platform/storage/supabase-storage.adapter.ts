import { SupabaseClient } from '@supabase/supabase-js';
import { SignedUpload, StoragePort, assertSafeObjectPath } from './storage.port';

/**
 * Supabase Storage implementation of StoragePort. Uses the server-side secret
 * key, which never leaves this process (security-and-audit.md §9).
 */
export class SupabaseStorageAdapter implements StoragePort {
  constructor(private readonly client: SupabaseClient) {}

  async createSignedUploadUrl(bucket: string, path: string): Promise<SignedUpload> {
    assertSafeObjectPath(path);
    const { data, error } = await this.client.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw new Error(`Could not create a signed upload URL: ${error?.message ?? 'no data'}`);
    }
    return { path: data.path, signedUrl: data.signedUrl, token: data.token };
  }

  async createSignedDownloadUrl(bucket: string, path: string, ttlSeconds: number): Promise<string> {
    assertSafeObjectPath(path);
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(path, ttlSeconds);
    if (error || !data) {
      throw new Error(`Could not create a signed download URL: ${error?.message ?? 'no data'}`);
    }
    return data.signedUrl;
  }

  async move(fromBucket: string, fromPath: string, toBucket: string, toPath: string): Promise<void> {
    assertSafeObjectPath(fromPath);
    assertSafeObjectPath(toPath);
    const { error } = await this.client.storage
      .from(fromBucket)
      .move(fromPath, toPath, { destinationBucket: toBucket });
    if (error) {
      throw new Error(`Could not move the object: ${error.message}`);
    }
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    paths.forEach(assertSafeObjectPath);
    const { error } = await this.client.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(`Could not remove objects: ${error.message}`);
    }
  }
}
