import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from './query.util';
import { pickDefined } from './update.util';

describe('sanitizeSearchTerm', () => {
  it('keeps ordinary words, accents and hyphens', () => {
    expect(sanitizeSearchTerm('  Pâtisserie  chef-de-partie ')).toBe('Pâtisserie chef-de-partie');
  });

  it('strips characters that would change a PostgREST filter expression', () => {
    const backslash = String.fromCharCode(92);
    const hostile = `chef%,status.eq.draft),(id.neq.0*"${backslash}`;
    const cleaned = sanitizeSearchTerm(hostile) ?? '';

    for (const forbidden of [',', '(', ')', '%', '*', '"', backslash]) {
      expect(cleaned).not.toContain(forbidden);
    }
  });

  it('returns undefined for an empty or symbol-only term', () => {
    expect(sanitizeSearchTerm(undefined)).toBeUndefined();
    expect(sanitizeSearchTerm('   ')).toBeUndefined();
    expect(sanitizeSearchTerm('(),%*')).toBeUndefined();
  });

  it('caps the length of the term', () => {
    expect(sanitizeSearchTerm('a'.repeat(500))?.length).toBe(100);
  });

  it('builds one ilike clause per whitelisted column', () => {
    expect(buildSearchFilter(['title', 'location'], 'porto')).toBe(
      'title.ilike.%porto%,location.ilike.%porto%',
    );
  });
});

describe('resolveSort', () => {
  const allowed = ['created_at', 'name'] as const;
  const fallback = { column: 'created_at', ascending: false };

  it('accepts a whitelisted column', () => {
    expect(resolveSort('name', 'asc', allowed, fallback)).toEqual({ column: 'name', ascending: true });
  });

  it('falls back instead of passing an unknown column through', () => {
    expect(resolveSort('password; drop table users', 'asc', allowed, fallback)).toEqual({
      column: 'created_at',
      ascending: true,
    });
  });

  it('uses the default direction when none is given', () => {
    expect(resolveSort(undefined, undefined, allowed, fallback)).toEqual(fallback);
  });
});

describe('pickDefined (mass-assignment guard)', () => {
  it('copies only allow-listed fields', () => {
    const body = { first_name: 'Ada', role: 'PLATFORM_ADMIN', id: 'someone-else' };

    expect(pickDefined(body, ['first_name'] as const)).toEqual({ first_name: 'Ada' });
  });

  it('drops undefined values so partial updates never clear columns', () => {
    const body: { bio?: string; location?: string } = { bio: undefined, location: 'Faro' };

    expect(pickDefined(body, ['bio', 'location'] as const)).toEqual({ location: 'Faro' });
  });
});
