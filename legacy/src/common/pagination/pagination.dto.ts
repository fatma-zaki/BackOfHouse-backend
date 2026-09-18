import { IsInt, IsOptional, IsString, Max, MaxLength, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDefaults } from '../constants';
import { PaginatedResponse, PaginationParams, SortOrder } from '../types';

/**
 * Query parameters shared by every collection endpoint.
 * `limit` is capped by validation so a client can never request unbounded data.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: PaginationDefaults.PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PaginationDefaults.PAGE;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PaginationDefaults.MAX_LIMIT,
    default: PaginationDefaults.LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PaginationDefaults.MAX_LIMIT)
  limit: number = PaginationDefaults.LIMIT;

  @ApiPropertyOptional({ description: 'Free-text search term' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Whitelisted sort column (per endpoint)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder;
}

/** Computes the safe page/limit/offset triple used by the data layer. */
export function parsePagination(query: PaginationQueryDto): PaginationParams {
  const page = Math.max(1, Math.trunc(query.page ?? PaginationDefaults.PAGE));
  const limit = Math.min(
    Math.max(1, Math.trunc(query.limit ?? PaginationDefaults.LIMIT)),
    PaginationDefaults.MAX_LIMIT,
  );
  return { page, limit, offset: (page - 1) * limit };
}

export function paginate<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
