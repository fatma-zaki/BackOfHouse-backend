/**
 * A small in-memory stand-in for the Supabase client.
 *
 * It implements the slice of the PostgREST builder the API actually uses, so
 * end-to-end tests drive the real guards, pipes, services and filters rather
 * than mocking those layers away. Nothing here talks to a network.
 */

export type Row = Record<string, unknown>;

export interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

type FilterOperator = 'eq' | 'neq' | 'in' | 'not-null';

interface Filter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

function matches(row: Row, filter: Filter): boolean {
  const actual = row[filter.column];

  switch (filter.operator) {
    case 'eq':
      return actual === filter.value;
    case 'neq':
      return actual !== filter.value;
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(actual);
    case 'not-null':
      return actual !== null && actual !== undefined;
    default:
      return false;
  }
}

export class FakeTable {
  constructor(public rows: Row[]) {}
}

type Mutation =
  | { kind: 'select' }
  | { kind: 'insert'; values: Row[] }
  | { kind: 'update'; values: Row }
  | { kind: 'delete' };

class FakeQueryBuilder<T> implements PromiseLike<QueryResult<T>> {
  private readonly filters: Filter[] = [];
  private mutation: Mutation = { kind: 'select' };
  private wantsCount = false;
  private rangeBounds: { from: number; to: number } | null = null;
  private sort: { column: string; ascending: boolean } | null = null;
  private returning = false;

  constructor(
    private readonly table: FakeTable,
    private readonly tableName: string,
    private readonly uniqueKeys: string[][],
  ) {}

  select(_columns?: string, options?: { count?: 'exact'; head?: boolean }): this {
    this.wantsCount = options?.count === 'exact';
    this.returning = true;
    return this;
  }

  insert(values: Row | Row[]): this {
    this.mutation = { kind: 'insert', values: Array.isArray(values) ? values : [values] };
    this.returning = false;
    return this;
  }

  upsert(values: Row, _options?: { onConflict?: string }): this {
    this.mutation = { kind: 'insert', values: [values] };
    return this;
  }

  update(values: Row): this {
    this.mutation = { kind: 'update', values };
    return this;
  }

  delete(): this {
    this.mutation = { kind: 'delete' };
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  in(column: string, value: unknown[]): this {
    this.filters.push({ column, operator: 'in', value });
    return this;
  }

  not(column: string, _operator: string, _value: unknown): this {
    this.filters.push({ column, operator: 'not-null', value: null });
    return this;
  }

  /** Text search is not modelled; the tests assert on sanitisation separately. */
  or(_expression: string): this {
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.sort = { column, ascending: options?.ascending ?? true };
    return this;
  }

  range(from: number, to: number): this {
    this.rangeBounds = { from, to };
    return this;
  }

  async maybeSingle<R = T>(): Promise<QueryResult<R>> {
    const result = this.run();
    if (result.error) {
      return { data: null, error: result.error };
    }
    const rows = result.rows;
    return { data: (rows[0] as R) ?? null, error: null };
  }

  async single<R = T>(): Promise<QueryResult<R>> {
    const result = this.run();
    if (result.error) {
      return { data: null, error: result.error };
    }
    if (result.rows.length === 0) {
      return { data: null, error: { message: 'no rows returned', code: 'PGRST116' } };
    }
    return { data: result.rows[0] as R, error: null };
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const result = this.run();
    const payload: QueryResult<T> = result.error
      ? { data: null, error: result.error, count: null }
      : { data: result.rows as unknown as T, error: null, count: result.total };

    return Promise.resolve(payload).then(onfulfilled, onrejected);
  }

  private run(): { rows: Row[]; total: number; error: { message: string; code?: string } | null } {
    const selected = this.table.rows.filter((row) => this.filters.every((f) => matches(row, f)));

    switch (this.mutation.kind) {
      case 'insert':
        return this.applyInsert(this.mutation.values);
      case 'update': {
        const values = this.mutation.values;
        selected.forEach((row) => Object.assign(row, values, { updated_at: new Date().toISOString() }));
        return { rows: selected, total: selected.length, error: null };
      }
      case 'delete': {
        this.table.rows = this.table.rows.filter((row) => !selected.includes(row));
        return { rows: selected, total: selected.length, error: null };
      }
      default:
        return { rows: this.paginate(this.applySort(selected)), total: selected.length, error: null };
    }
  }

  private applyInsert(values: Row[]): {
    rows: Row[];
    total: number;
    error: { message: string; code?: string } | null;
  } {
    const inserted: Row[] = [];

    for (const value of values) {
      const conflict = this.uniqueKeys.find((key) =>
        this.table.rows.some((row) => key.every((column) => row[column] === value[column])),
      );

      if (conflict) {
        return {
          rows: [],
          total: 0,
          error: {
            message: `duplicate key value violates unique constraint on ${this.tableName}`,
            code: '23505',
          },
        };
      }

      const now = new Date().toISOString();
      const row: Row = {
        id: value['id'] ?? `generated-${this.tableName}-${this.table.rows.length + inserted.length}`,
        created_at: now,
        updated_at: now,
        ...value,
      };
      this.table.rows.push(row);
      inserted.push(row);
    }

    return { rows: inserted, total: inserted.length, error: null };
  }

  private applySort(rows: Row[]): Row[] {
    if (!this.sort) {
      return rows;
    }
    const { column, ascending } = this.sort;
    return [...rows].sort((left, right) => {
      const a = String(left[column] ?? '');
      const b = String(right[column] ?? '');
      return ascending ? a.localeCompare(b) : b.localeCompare(a);
    });
  }

  private paginate(rows: Row[]): Row[] {
    if (!this.rangeBounds) {
      return rows;
    }
    return rows.slice(this.rangeBounds.from, this.rangeBounds.to + 1);
  }
}

export interface FakeAuthUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  email_confirmed_at?: string | null;
}

export type RpcHandler = (args: Record<string, unknown>) => QueryResult<Row>;

/**
 * Minimal Supabase client: tables, auth token verification and RPC handlers.
 * Tests seed `tables` and assert on the rows the API leaves behind.
 */
export class FakeSupabaseClient {
  readonly tables = new Map<string, FakeTable>();
  readonly sessions = new Map<string, FakeAuthUser>();
  readonly rpcHandlers = new Map<string, RpcHandler>();
  private readonly uniqueKeys = new Map<string, string[][]>();

  seed(tableName: string, rows: Row[], uniqueKeys: string[][] = []): void {
    this.tables.set(tableName, new FakeTable(rows.map((row) => ({ ...row }))));
    this.uniqueKeys.set(tableName, uniqueKeys);
  }

  rowsOf(tableName: string): Row[] {
    return this.tables.get(tableName)?.rows ?? [];
  }

  from<T = Row[]>(tableName: string): FakeQueryBuilder<T> {
    if (!this.tables.has(tableName)) {
      this.seed(tableName, []);
    }
    return new FakeQueryBuilder<T>(
      this.tables.get(tableName) as FakeTable,
      tableName,
      this.uniqueKeys.get(tableName) ?? [],
    );
  }

  rpc(name: string, args: Record<string, unknown>) {
    const handler = this.rpcHandlers.get(name);
    const result: QueryResult<Row> = handler
      ? handler(args)
      : { data: null, error: { message: `unknown function ${name}` } };

    return {
      single: async <R>(): Promise<QueryResult<R>> => result as unknown as QueryResult<R>,
    };
  }

  readonly auth = {
    getUser: async (token: string) => {
      const user = this.sessions.get(token);
      return user
        ? { data: { user }, error: null }
        : { data: { user: null }, error: { message: 'invalid token' } };
    },
    admin: {
      getUserById: async (id: string) => {
        const user = [...this.sessions.values()].find((candidate) => candidate.id === id);
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: 'not found' } };
      },
      signOut: async () => ({ error: null }),
      updateUserById: async () => ({ data: { user: null }, error: null }),
    },
  };

  readonly storage = {
    from: () => ({
      upload: async (path: string) => ({ data: { path }, error: null }),
      remove: async () => ({ data: [], error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
    }),
  };
}
