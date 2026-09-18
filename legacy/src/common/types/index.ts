export type UUID = string;
export type ISODateString = string;
export type SortOrder = 'asc' | 'desc';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/** Shape returned by repository-style list methods before pagination metadata. */
export interface ListResult<T> {
  data: T[];
  total: number;
}
