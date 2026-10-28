import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PERMISSION_KEYS, permissionsForRole, rolesWithPermission, STAFF_ROLES, StaffRole } from './permissions';

/**
 * Parses the "Role → permissions" table of the hand-off doc, so the code matrix
 * cannot drift from what the web team built the screens against.
 * Rows look like `| verification.view / decide | ✓ | ✓ | | | |`.
 */
function matrixFromDoc(): Map<string, StaffRole[]> {
  const doc = readFileSync(join(__dirname, '../../../../docs/admin/docs/02-roles-and-permissions.md'), 'utf8');
  const section = doc.slice(doc.indexOf('## Role → permissions'), doc.indexOf('## Each role'));
  const matrix = new Map<string, StaffRole[]>();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 8 || !/^[a-z]/.test(cells[1])) continue;
    const roles = STAFF_ROLES.filter((_, i) => cells[2 + i].startsWith('✓'));
    const [first, ...rest] = cells[1].split(' / ');
    const namespace = first.split('.')[0];
    for (const key of [first, ...rest.map((k) => (k.includes('.') ? k : `${namespace}.${k}`))]) {
      matrix.set(key.replace(/^listings\./, 'opportunities.'), roles);
    }
  }
  return matrix;
}

describe('staff permission matrix', () => {
  const fromDoc = matrixFromDoc();

  it('has exactly the keys of the hand-off table (listings.* renamed, D1)', () => {
    expect([...PERMISSION_KEYS].sort()).toEqual([...fromDoc.keys()].sort());
  });

  it.each(PERMISSION_KEYS)('%s is held by the roles in the hand-off table', (key) => {
    expect([...rolesWithPermission(key)]).toEqual(fromDoc.get(key));
  });

  it('gives Super admin every permission and Analyst only analytics and exports', () => {
    expect(permissionsForRole('SUPER_ADMIN')).toEqual(PERMISSION_KEYS);
    expect(permissionsForRole('ANALYST')).toEqual(['analytics.view', 'exports.create', 'exports.schedule']);
  });
});
