import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyRole } from '../company.types';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = 'slug must be lowercase words separated by single hyphens';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Harbour Table Group' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'harbour-table-group' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(SLUG_RULE, { message: SLUG_MESSAGE })
  slug!: string;

  @ApiPropertyOptional({ example: 'Hospitality group operating four venues.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://harbourtable.example' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'Hospitality' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: 'Lisbon, Portugal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'URL returned by the files endpoint' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  logo_url?: string;

  @ApiPropertyOptional({ description: 'URL returned by the files endpoint' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_url?: string;
}

/** The slug is immutable: it is a public identifier other records may reference. */
export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  logo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  cover_url?: string;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Profile id (users.id) of the member to add' })
  @IsUUID('4')
  user_id!: string;

  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole)
  role!: CompanyRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole)
  role!: CompanyRole;
}
