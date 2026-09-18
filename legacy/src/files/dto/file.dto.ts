import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileCategory } from '../file.types';

export class UploadFileQueryDto {
  @ApiProperty({ enum: FileCategory, description: 'What the file will be used for' })
  @IsEnum(FileCategory)
  category!: FileCategory;
}

export class DeleteFileQueryDto {
  @ApiProperty({ enum: FileCategory })
  @IsEnum(FileCategory)
  category!: FileCategory;

  @ApiProperty({ description: 'Object path returned by the upload endpoint' })
  @IsString()
  @MaxLength(200)
  path!: string;
}
