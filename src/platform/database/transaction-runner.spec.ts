import { TransactionRunner, isRetryableTransactionError } from './transaction-runner';
import { PrismaService } from './prisma.service';
import { isTransactionPoolerUrl, toDriverConnectionString } from './connection-string';

function fakePrisma(failures: unknown[]): { prisma: PrismaService; calls: () => number } {
  let calls = 0;
  const tx = { marker: 'tx' };
  const prisma = {
    $transaction: async (work: (client: unknown) => Promise<unknown>) => {
      calls += 1;
      const failure = failures.shift();
      if (failure) {
        throw failure;
      }
      return work(tx);
    },
  } as unknown as PrismaService;
  return { prisma, calls: () => calls };
}

describe('TransactionRunner', () => {
  it('retries a serialization failure and then succeeds', async () => {
    const { prisma, calls } = fakePrisma([{ code: 'P2034' }, { cause: { originalCode: '40001' } }]);
    const runner = new TransactionRunner(prisma);

    await expect(runner.run(async () => 'done')).resolves.toBe('done');
    expect(calls()).toBe(3);
  });

  it('gives up after three retries', async () => {
    const deadlock = { meta: { driverAdapterError: { cause: { originalCode: '40P01' } } } };
    const { prisma, calls } = fakePrisma([deadlock, deadlock, deadlock, deadlock, deadlock]);
    const runner = new TransactionRunner(prisma);

    await expect(runner.run(async () => 'never')).rejects.toBe(deadlock);
    expect(calls()).toBe(4);
  });

  it('does not retry other errors', async () => {
    const uniqueViolation = { code: 'P2002' };
    const { prisma, calls } = fakePrisma([uniqueViolation]);
    const runner = new TransactionRunner(prisma);

    await expect(runner.run(async () => 'never')).rejects.toBe(uniqueViolation);
    expect(calls()).toBe(1);
  });

  it('exposes the transaction only inside run()', async () => {
    const { prisma } = fakePrisma([]);
    const runner = new TransactionRunner(prisma);

    expect(runner.current()).toBeUndefined();
    expect(() => runner.requireTransaction('test')).toThrow(/must run inside/);
    await runner.run(async (tx) => {
      expect(runner.current()).toBe(tx);
      expect(runner.client()).toBe(tx);
    });
    expect(runner.client()).toBe(prisma);
  });

  it('identifies retryable errors structurally', () => {
    expect(isRetryableTransactionError({ code: '40001' })).toBe(true);
    expect(isRetryableTransactionError(new Error('plain'))).toBe(false);
    expect(isRetryableTransactionError(null)).toBe(false);
  });
});

describe('connection strings', () => {
  it('removes engine-only parameters before handing the URL to pg', () => {
    const url = 'postgresql://u:p@host:6543/postgres?pgbouncer=true&schema=app&sslmode=require';
    const cleaned = new URL(toDriverConnectionString(url));
    expect(cleaned.searchParams.has('pgbouncer')).toBe(false);
    expect(cleaned.searchParams.has('schema')).toBe(false);
    expect(cleaned.searchParams.get('sslmode')).toBe('require');
  });

  it('detects the Supavisor transaction pooler', () => {
    expect(isTransactionPoolerUrl('postgresql://u:p@pooler.supabase.com:6543/postgres')).toBe(true);
    expect(isTransactionPoolerUrl('postgresql://u:p@pooler.supabase.com:5432/postgres?pgbouncer=true')).toBe(true);
    expect(isTransactionPoolerUrl('postgresql://u:p@pooler.supabase.com:5432/postgres')).toBe(false);
  });
});
