/** Metadata for cursor (keyset) pagination on public and user lists (ADR-008). */
export interface CursorPageMeta {
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * App surface lists (contracts/app `PageMeta`, D4): `?page=&page_size=` → the app
 * keeps asking until `has_more` is false. `total` is optional.
 */
export interface AppPageMeta {
  page: number;
  page_size: number;
  has_more: boolean;
  total?: number;
}

/**
 * Admin tables (contracts/admin `PageMeta`, D4): "Showing 1–20 of 4,870" needs
 * the total and the page count.
 */
export interface OffsetPageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** `{ skip, take }` for a 1-based page. */
export function pageWindow(query: { page: number; page_size: number }): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.page_size, take: query.page_size };
}

/**
 * App page from a query that fetched `page_size + 1` rows: the extra row only
 * tells whether another page exists, and is dropped.
 */
export function appPage<T>(
  rows: T[],
  query: { page: number; page_size: number },
  total?: number,
): Page<T, AppPageMeta> {
  const has_more = rows.length > query.page_size;
  return new Page(rows.slice(0, query.page_size), {
    page: query.page,
    page_size: query.page_size,
    has_more,
    ...(total === undefined ? {} : { total }),
  });
}

/** Admin page with the total count. */
export function adminPage<T>(
  items: T[],
  query: { page: number; page_size: number },
  total: number,
): Page<T, OffsetPageMeta> {
  return new Page(items, {
    page: query.page,
    page_size: query.page_size,
    total,
    total_pages: Math.max(1, Math.ceil(total / query.page_size)),
  });
}

/**
 * A page of results. Returning an instance from a controller makes the
 * envelope interceptor render `{ data: items, meta }` instead of `{ data }`.
 */
export class Page<T, M extends CursorPageMeta | AppPageMeta | OffsetPageMeta = CursorPageMeta> {
  constructor(
    readonly items: T[],
    readonly meta: M,
  ) {}
}
