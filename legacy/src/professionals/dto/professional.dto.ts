import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus, ProfileVisibility } from '../professional.types';

const MAX_TAGS = 25;
const MAX_TAG_LENGTH = 60;
const MAX_LINKS = 10;
const MAX_YEARS = 80;

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Pastry chef' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  profession!: string;

  @ApiPropertyOptional({ example: ['viennoiserie', 'plated desserts'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: ['menu costing', 'team training'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 8, description: 'Years of professional experience' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_YEARS)
  experience?: number;

  @ApiPropertyOptional({ example: 'Porto, Portugal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @ApiPropertyOptional({ example: ['https://portfolio.example/ada'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LINKS)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  portfolio_links?: string[];

  @ApiPropertyOptional({ enum: ProfileVisibility, default: ProfileVisibility.Public })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profile_visibility?: ProfileVisibility;
}

export class UpdateProfessionalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  specialties?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_YEARS)
  experience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LINKS)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  portfolio_links?: string[];

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profile_visibility?: ProfileVisibility;
}
