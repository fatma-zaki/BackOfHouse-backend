import { Controller, Delete, HttpCode, HttpStatus, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService, UploadCandidate } from './files.service';
import { DeleteFileQueryDto, UploadFileQueryDto } from './dto/file.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { BadRequestException } from '../common/exceptions/business.exceptions';
import { MAX_UPLOAD_BYTES } from '../common/constants';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Auth(Permission.FILE_UPLOAD)
  // Multer enforces a hard ceiling before the body is buffered; the service
  // then re-checks against the configured limit.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image and receive its public URL' })
  @ApiResponse({ status: 201, description: 'Stored; the returned URL can be saved on a resource' })
  @ApiResponse({ status: 400, description: 'Missing file, oversized, or content does not match its type' })
  upload(
    @UploadedFile() file: UploadCandidate | undefined,
    @Query() query: UploadFileQueryDto,
    @CurrentUser() user: AuthContext,
  ) {
    if (!file) {
      throw new BadRequestException('A file is required in the "file" field');
    }

    return this.filesService.upload(query.category, file, user);
  }

  @Delete()
  @Auth(Permission.FILE_DELETE_OWN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of your own uploads' })
  async remove(@Query() query: DeleteFileQueryDto, @CurrentUser() user: AuthContext): Promise<void> {
    await this.filesService.remove(query.category, query.path, user);
  }
}
