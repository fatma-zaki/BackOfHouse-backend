import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
/** The app asks for 20; contracts/app caps page_size at 50. */
export const MAX_APP_PAGE_SIZE = 50;

/** `?limit=20&cursor=…` for public and user lists (api-map.md §1.5). */
export class CursorPaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Opaque cursor from the previous page (meta.next_cursor)' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;
}

/** `?page=&page_size=` for app surface lists (contracts/app `Page`, `PageSize`). */
export class AppPaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: '1-based' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_APP_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_APP_PAGE_SIZE)
  page_size: number = DEFAULT_PAGE_SIZE;
}

/** `?page=&page_size=` for staff tables (api-map.md §1.5). */
export class OffsetPaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  page_size: number = DEFAULT_PAGE_SIZE;
}

/**
 * `?page=&page_size=&sort=` for admin tables (contracts/admin). `sort` is a field
 * name, `-` prefix for descending; each controller checks it against its allow-list.
 */
export class AdminPaginationQueryDto extends OffsetPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Field name, prefix with - for descending, e.g. -created_at' })
  @IsOptional()
  @IsString()
  @Matches(/^-?[a-z][a-z0-9_]{0,63}$/, { message: 'sort must be a field name, optionally prefixed with -' })
  sort?: string;
}
