import { StorageBuckets } from '../common/constants';

/** Upload categories the API accepts. A client can only name one of these. */
export enum FileCategory {
  Avatar = 'avatar',
  CompanyLogo = 'company-logo',
  CompanyCover = 'company-cover',
  EventCover = 'event-cover',
  CourseThumbnail = 'course-thumbnail',
}

export interface FileCategoryRules {
  bucket: string;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const FILE_CATEGORIES: Readonly<Record<FileCategory, FileCategoryRules>> = {
  [FileCategory.Avatar]: {
    bucket: StorageBuckets.AVATARS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  [FileCategory.CompanyLogo]: {
    bucket: StorageBuckets.COMPANY_LOGOS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  [FileCategory.CompanyCover]: {
    bucket: StorageBuckets.COMPANY_LOGOS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  [FileCategory.EventCover]: {
    bucket: StorageBuckets.EVENT_COVERS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  [FileCategory.CourseThumbnail]: {
    bucket: StorageBuckets.COURSE_THUMBNAILS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
};

export interface UploadedFileResult {
  bucket: string;
  path: string;
  url: string;
  content_type: string;
}

function startsWith(buffer: Buffer, signature: readonly number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) {
    return false;
  }
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

/**
 * Identifies an image from its leading bytes.
 *
 * Extensions and Content-Type headers are attacker-controlled, so the real
 * format is read from the file signature and compared against them.
 */
export function detectImageType(buffer: Buffer): string | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  // WEBP is a RIFF container: "RIFF" .... "WEBP"
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  return null;
}
