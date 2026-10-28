import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorCode } from './error-codes';

/** D3: every code the server can return is documented in the shared catalog. */
describe('docs/error-codes.md', () => {
  const catalog = readFileSync(join(__dirname, '..', '..', '..', 'docs', 'error-codes.md'), 'utf8');

  it.each(Object.values(ErrorCode))('lists %s', (code) => {
    expect(catalog).toContain(`\`${code}\``);
  });
});
