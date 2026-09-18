import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../event.types';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CAPACITY = 100_000;

export class CreateEventDto {
  @ApiProperty({ example: 'Winter supplier showcase' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'winter-supplier-showcase' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_RULE, { message: 'slug must be lowercase words separated by single hyphens' })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 'Back Of House' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organizer!: string;

  @ApiPropertyOptional({ example: 'Lisbon, Portugal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ example: '2026-11-04T09:00:00.000Z' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-11-04T17:00:00.000Z' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_image_url?: string;

  @ApiPropertyOptional({ example: 150, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_CAPACITY)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Hosting company; you must be a member of it' })
  @IsOptional()
  @IsUUID('4')
  company_id?: string;
}

/** The slug and hosting company are immutable once the event exists. */
export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organizer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_image_url?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_CAPACITY)
  capacity?: number;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
