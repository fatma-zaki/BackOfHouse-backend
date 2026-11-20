import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';

type Operation = { requestBody?: unknown; operationId?: string };
type Contract = { paths: Record<string, Record<string, Operation>> };

const WRITES = ['post', 'put', 'patch', 'delete'];

/**
 * Exit test (execution-plan Phase 5): companies own application decisions, so the back
 * office has no operation that writes an application's status (contracts/admin
 * GET /applications is read-only).
 */
describe('contracts/admin', () => {
  const contract = load(
    readFileSync(join(__dirname, '..', '..', 'contracts', 'admin', 'openapi.yaml'), 'utf8'),
  ) as Contract;

  it('has no operation that writes application status', () => {
    const writes = Object.entries(contract.paths).flatMap(([path, item]) =>
      WRITES.filter((method) => item[method]).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(writes.filter((op) => /\/applications?(\/|$)|application[-_]?status/i.test(op))).toEqual([]);
  });

  it('still lists the read-only application routes', () => {
    expect(contract.paths['/applications']?.get).toBeDefined();
    expect(contract.paths['/users/{id}/applications']?.get).toBeDefined();
  });
});
