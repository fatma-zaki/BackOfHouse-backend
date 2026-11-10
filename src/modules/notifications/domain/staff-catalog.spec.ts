import { LOCALES } from '../../../common/i18n/locale';
import { PERMISSION_KEYS } from '../../access';
import { isKnownStaffType, STAFF_NOTIFICATION_CATALOG, staffCatalogEntry } from './staff-catalog';
import { placeholdersOf } from './template';

describe('staff notification catalog', () => {
  it('has unique, well-formed types', () => {
    const types = STAFF_NOTIFICATION_CATALOG.map((entry) => entry.type);
    expect(new Set(types).size).toBe(types.length);
    for (const type of types) expect(type).toMatch(/^staff\.[a-z][a-z0-9_]*$/);
  });

  it.each(STAFF_NOTIFICATION_CATALOG.map((entry) => [entry.type, entry] as const))(
    '%s has text in both languages with the same placeholders and a real permission',
    (_, entry) => {
      expect((PERMISSION_KEYS as readonly string[]).includes(entry.permission)).toBe(true);
      for (const key of ['title', 'body'] as const) {
        for (const locale of LOCALES) expect(entry.templates[locale][key].trim()).not.toBe('');
        expect(placeholdersOf(entry.templates.ar[key])).toEqual(placeholdersOf(entry.templates.en[key]));
      }
    },
  );

  it('looks types up and refuses unknown ones', () => {
    expect(staffCatalogEntry('staff.verification_submitted').category).toBe('VERIFICATION');
    expect(isKnownStaffType('staff.nope')).toBe(false);
    expect(() => staffCatalogEntry('staff.nope')).toThrow(/Unknown staff notification type/);
  });
});
