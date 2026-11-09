import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppPaginationQueryDto } from '../../../common/pagination';

const COMPANY_TYPES = [
  'EVENT_ORGANIZER',
  'SUPPLIER',
  'VENUE',
  'PRODUCTION',
  'AGENCY',
  'SERVICE_PROVIDER',
  'OTHER',
] as const;

/** contracts/app GET /companies query. */
export class CompanyListQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: [...COMPANY_TYPES] })
  @IsOptional()
  @IsIn([...COMPANY_TYPES])
  type?: (typeof COMPANY_TYPES)[number];

  @ApiPropertyOptional({ description: 'Only the editorial "Companies to Watch" list' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  editors_pick?: boolean;

  @ApiPropertyOptional({ description: 'Free-text search, case-insensitive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

/** contracts/app GET /professionals query. */
export class ProfessionalListQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['PRODUCERS', 'DESIGNERS', 'TECHNICAL', 'STUDENTS'] })
  @IsOptional()
  @IsIn(['PRODUCERS', 'DESIGNERS', 'TECHNICAL', 'STUDENTS'])
  filter?: 'PRODUCERS' | 'DESIGNERS' | 'TECHNICAL' | 'STUDENTS';

  @ApiPropertyOptional({ description: 'Free-text search, case-insensitive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
