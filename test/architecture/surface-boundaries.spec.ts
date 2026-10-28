import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const depcruise = join(root, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruiser.mjs');

/** Runs the project's dependency-cruiser rules against a directory that contains a `src/` tree. */
function cruise(cwd: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [depcruise, 'src', '--config', join(root, '.dependency-cruiser.js')], {
    cwd,
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('surface boundaries (ADR-031, .dependency-cruiser.js)', () => {
  it('fails when the app surface imports the admin surface, or a module imports a surface', () => {
    const { status, output } = cruise(join(__dirname, 'fixtures', 'surface-leak'));

    expect(status).not.toBe(0);
    expect(output).toContain('app-surface-not-admin: src/surfaces/app/leak.ts → src/surfaces/admin/admin-only.dto.ts');
    expect(output).toContain('business-logic-not-surfaces: src/modules/demo/services/demo.service.ts');
  });

  it('passes on the real source tree', () => {
    const { status, output } = cruise(root);

    expect(output).toContain('no dependency violations found');
    expect(status).toBe(0);
  });
});
