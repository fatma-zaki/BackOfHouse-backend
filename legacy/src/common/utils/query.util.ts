import { SortOrder } from '../types';

/** Characters accepted in a search term. Everything else is dropped. */
const SEARCH_ALLOWED = /[^\p{L}\p{N} .'&_-]/gu;
const MAX_SEARCH_LENGTH = 100;

/**
 * Makes a user-supplied search term safe to embed in a PostgREST filter.
 *
 * PostgREST filters are a string grammar: commas, parentheses, quotes and
 * wildcards change the meaning of the expression. Rather than escaping them we
 * drop everything outside a conservative allow-list, which keeps the filter a
 * plain pattern match and removes the injection surface entirely.
 */
export function sanitizeSearchTerm(term: string | undefined): string | undefined {
  if (!term) {
    return undefined;
  }
  const cleaned = term.replace(SEARCH_ALLOWED, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) {
    return undefined;
  }
  return cleaned.slice(0, MAX_SEARCH_LENGTH);
}

/** Builds a PostgREST `or` expression matching the term across the given columns. */
export function buildSearchFilter(columns: readonly string[], term: string): string {
  return columns.map((column) => `${column}.ilike.%${term}%`).join(',');
}

export interface ResolvedSort {
  column: string;
  ascending: boolean;
}

/**
 * Resolves a client-supplied sort into a whitelisted column.
 * Unknown columns fall back to the endpoint default — never passed through.
 */
export function resolveSort(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  allowedColumns: readonly string[],
  fallback: ResolvedSort,
): ResolvedSort {
  const column = sortBy && allowedColumns.includes(sortBy) ? sortBy : fallback.column;
  const ascending = sortOrder ? sortOrder === 'asc' : fallback.ascending;
  return { column, ascending };
}
