import { SignedUpload, StoragePort, assertSafeObjectPath } from './storage.port';

/**
 * Local and test without Supabase: objects live in this process. Signed URLs are
 * `memory://` links that expire like real ones but are never served.
 */
export class InMemoryStorageAdapter implements StoragePort {
  readonly objects = new Map<string, { bytes: Buffer; contentType: string }>();
  readonly issuedUrls: { bucket: string; path: string; ttlSeconds: number }[] = [];

  async upload(bucket: string, path: string, bytes: Buffer, contentType: string): Promise<void> {
    assertSafeObjectPath(path);
    const key = `${bucket}/${path}`;
    if (this.objects.has(key)) throw new Error('Could not upload the object: it already exists');
    this.objects.set(key, { bytes: Buffer.from(bytes), contentType });
  }

  async createSignedUploadUrl(bucket: string, path: string): Promise<SignedUpload> {
    assertSafeObjectPath(path);
    return { path, signedUrl: `memory://${bucket}/${path}?upload`, token: 'memory' };
  }

  async createSignedDownloadUrl(bucket: string, path: string, ttlSeconds: number): Promise<string> {
    assertSafeObjectPath(path);
    if (!this.objects.has(`${bucket}/${path}`)) throw new Error('Could not create a signed download URL: not found');
    this.issuedUrls.push({ bucket, path, ttlSeconds });
    return `memory://${bucket}/${path}?expires_in=${ttlSeconds}`;
  }

  async move(fromBucket: string, fromPath: string, toBucket: string, toPath: string): Promise<void> {
    assertSafeObjectPath(fromPath);
    assertSafeObjectPath(toPath);
    const object = this.objects.get(`${fromBucket}/${fromPath}`);
    if (!object) throw new Error('Could not move the object: not found');
    this.objects.delete(`${fromBucket}/${fromPath}`);
    this.objects.set(`${toBucket}/${toPath}`, object);
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    paths.forEach(assertSafeObjectPath);
    for (const path of paths) this.objects.delete(`${bucket}/${path}`);
  }

  clear(): void {
    this.objects.clear();
    this.issuedUrls.length = 0;
  }
}
