/**
 * Query parameters understood by the old Prisma engine but not by the `pg`
 * driver that Prisma 7 uses. Passing them through would send them to Postgres
 * as unknown startup parameters.
 */
const ENGINE_ONLY_PARAMS = ['pgbouncer', 'schema', 'connection_limit', 'pool_timeout', 'statement_cache_size'];

export function toDriverConnectionString(url: string): string {
  const parsed = new URL(url);
  for (const param of ENGINE_ONLY_PARAMS) {
    parsed.searchParams.delete(param);
  }
  return parsed.toString();
}

/**
 * True for Supavisor transaction mode (port 6543 or `pgbouncer=true`), which
 * does not support session features. pg-boss needs LISTEN and advisory locks,
 * so the worker refuses such a URL (ADR-010, supabase-architecture.md §2.1).
 */
export function isTransactionPoolerUrl(url: string): boolean {
  const parsed = new URL(url);
  return parsed.port === '6543' || parsed.searchParams.get('pgbouncer') === 'true';
}
