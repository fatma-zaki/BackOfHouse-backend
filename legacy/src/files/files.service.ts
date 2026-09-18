import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { AppConfig, getAppConfig } from '../config/configuration';
import { FILE_CATEGORIES, FileCategory, UploadedFileResult, detectImageType } from './file.types';
import { AuthContext } from '../auth/types/auth-context';
import {
  BadRequestException,
  ForbiddenException,
  InternalOperationException,
} from '../common/exceptions/business.exceptions';

/** A stored object path: `<profile id>/<random>.<ext>`. Nothing else is accepted. */
const STORAGE_PATH_RULE =
  /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

export interface UploadCandidate {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Uploads to Supabase Storage.
 *
 * Three independent checks run before anything is stored: the declared size,
 * the declared content type and extension, and the actual leading bytes of the
 * file. The storage path is generated here — a client never supplies a bucket
 * or a path, so it cannot write outside its own prefix or overwrite somebody
 * else's object.
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly maxFileSize: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
    configService: ConfigService,
  ) {
    this.maxFileSize = getAppConfig((key) => configService.get<AppConfig>(key)).maxFileSize;
  }

  get maxUploadBytes(): number {
    return this.maxFileSize;
  }

  async upload(
    category: FileCategory,
    file: UploadCandidate,
    context: AuthContext,
  ): Promise<UploadedFileResult> {
    const rules = FILE_CATEGORIES[category];

    if (file.size <= 0 || file.size > this.maxFileSize) {
      throw new BadRequestException(`File size must be between 1 and ${this.maxFileSize} bytes`);
    }

    if (!rules.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported content type. Allowed: ${rules.allowedMimeTypes.join(', ')}`);
    }

    const extension = this.extensionOf(file.originalname);
    if (!rules.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`Unsupported extension. Allowed: ${rules.allowedExtensions.join(', ')}`);
    }

    // The bytes themselves decide: a renamed executable or a spoofed
    // Content-Type is rejected here even though the two checks above passed.
    const detected = detectImageType(file.buffer);
    if (!detected || detected !== file.mimetype) {
      throw new BadRequestException('File content does not match the declared image type');
    }

    const objectPath = `${context.profileId}/${randomUUID()}.${extension}`;

    const { data, error } = await this.databaseService.admin.storage
      .from(rules.bucket)
      .upload(objectPath, file.buffer, {
        contentType: detected,
        upsert: false,
        cacheControl: '3600',
      });

    if (error || !data) {
      this.logger.error(`Upload failed: ${error?.message ?? 'no path returned'}`);
      throw new InternalOperationException('Unable to store the file');
    }

    const publicUrl = this.databaseService.admin.storage
      .from(rules.bucket)
      .getPublicUrl(data.path).data.publicUrl;

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.FILE_UPLOADED,
      entity_type: 'file',
      metadata: { bucket: rules.bucket, path: data.path, size: file.size, content_type: detected },
    });

    return { bucket: rules.bucket, path: data.path, url: publicUrl, content_type: detected };
  }

  async remove(category: FileCategory, objectPath: string, context: AuthContext): Promise<void> {
    const rules = FILE_CATEGORIES[category];

    if (!STORAGE_PATH_RULE.test(objectPath)) {
      throw new BadRequestException('Invalid file path');
    }

    // The first path segment is the owner's profile id, so this also rules out
    // traversal attempts such as `../other-user/avatar.png`.
    const [owner] = objectPath.split('/');
    if (owner !== context.profileId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    const { error } = await this.databaseService.admin.storage.from(rules.bucket).remove([objectPath]);

    if (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw new InternalOperationException('Unable to delete the file');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.FILE_DELETED,
      entity_type: 'file',
      metadata: { bucket: rules.bucket, path: objectPath },
    });
  }

  private extensionOf(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}
