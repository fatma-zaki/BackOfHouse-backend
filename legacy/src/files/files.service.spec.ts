import { ConfigService } from '@nestjs/config';
import { FilesService, UploadCandidate } from './files.service';
import { FileCategory } from './file.types';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/types/auth-context';
import { Role } from '../auth/decorators/permissions.enum';
import { BadRequestException, ForbiddenException } from '../common/exceptions/business.exceptions';
import { FakeSupabaseClient } from '../../test/support/fake-supabase';

const PROFILE_ID = 'aaaa2222-2222-4222-8222-222222222222';
const OTHER_PROFILE_ID = 'aaaa3333-3333-4333-8333-333333333333';
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

const member: AuthContext = {
  authUserId: 'auth-member',
  profileId: PROFILE_ID,
  email: 'ada@example.test',
  role: Role.USER,
  accessToken: 'token',
};

function file(overrides: Partial<UploadCandidate> = {}): UploadCandidate {
  return {
    originalname: 'avatar.png',
    mimetype: 'image/png',
    size: PNG_HEADER.length,
    buffer: PNG_HEADER,
    ...overrides,
  };
}

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    const supabase = new FakeSupabaseClient();
    const databaseService = { admin: supabase } as unknown as DatabaseService;
    const configService = { get: () => ({ maxFileSize: 1024 }) } as unknown as ConfigService;
    service = new FilesService(databaseService, new AuditService(databaseService), configService);
  });

  it('stores a genuine image under a server-generated path in the caller prefix', async () => {
    const result = await service.upload(FileCategory.Avatar, file(), member);

    expect(result.path).toMatch(new RegExp(`^${PROFILE_ID}/[0-9a-f-]{36}\\.png$`));
    expect(result.content_type).toBe('image/png');
  });

  it('ignores the client file name when building the path', async () => {
    const result = await service.upload(
      FileCategory.Avatar,
      file({ originalname: '../../other-user/evil.png' }),
      member,
    );

    expect(result.path.startsWith(`${PROFILE_ID}/`)).toBe(true);
    expect(result.path).not.toContain('..');
  });

  it('rejects content that does not match the declared type', async () => {
    const script = Buffer.from('#!/bin/sh\nrm -rf /\n');

    await expect(
      service.upload(FileCategory.Avatar, file({ buffer: script, size: script.length }), member),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a disallowed extension even with valid bytes', async () => {
    await expect(
      service.upload(FileCategory.Avatar, file({ originalname: 'avatar.svg' }), member),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a disallowed content type', async () => {
    await expect(
      service.upload(FileCategory.Avatar, file({ mimetype: 'text/html' }), member),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an oversized file', async () => {
    await expect(
      service.upload(FileCategory.Avatar, file({ size: 4096 }), member),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to delete another member file', async () => {
    const path = `${OTHER_PROFILE_ID}/aaaa2222-2222-4222-8222-222222222222.png`;

    await expect(service.remove(FileCategory.Avatar, path, member)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each(['../secrets.png', `${PROFILE_ID}/../../x.png`, 'avatars/file.png', `${PROFILE_ID}/x.exe`])(
    'rejects the path %p',
    async (path) => {
      await expect(service.remove(FileCategory.Avatar, path, member)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
});
