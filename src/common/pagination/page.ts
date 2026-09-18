/** Metadata for cursor (keyset) pagination on public and user lists (ADR-008). */
export interface CursorPageMeta {
  next_cursor: string | null;
  has_more: boolean;
}

/** Metadata for offset pagination on admin tables (api-map.md §1.5). */
export interface OffsetPageMeta {
  page: number;
  page_size: number;
  total: number;
}

/**
 * A page of results. Returning an instance from a controller makes the
 * envelope interceptor render `{ data: items, meta }` instead of `{ data }`.
 */
export class Page<T, M extends CursorPageMeta | OffsetPageMeta = CursorPageMeta> {
  constructor(
    readonly items: T[],
    readonly meta: M,
  ) {}
}
