import { IsEnum, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentStatus, NewsStatus, ReactionType } from '../news.types';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateNewsArticleDto {
  @ApiProperty({ example: 'Seasonal produce report: autumn' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'seasonal-produce-report-autumn' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(SLUG_RULE, { message: 'slug must be lowercase words separated by single hyphens' })
  slug!: string;

  @ApiProperty({ description: 'Article body (markdown)' })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_image_url?: string;
}

export class UpdateNewsArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_image_url?: string;

  @ApiPropertyOptional({ enum: NewsStatus })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great write-up, the sourcing notes were useful.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class ModerateCommentDto {
  @ApiProperty({ enum: CommentStatus })
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}

export class UpsertReactionDto {
  @ApiProperty({ enum: ReactionType })
  @IsEnum(ReactionType)
  type!: ReactionType;
}
