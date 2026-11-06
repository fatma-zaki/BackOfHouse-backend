import { LOCALES } from '../../../common/i18n/locale';
import { catalogEntry, isKnownType, NOTIFICATION_CATALOG } from './catalog';
import { placeholdersOf, renderTemplate } from './template';

const TYPE_FORMAT = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

describe('notification catalog', () => {
  it('has unique, well-formed types (the notifications.type CHECK)', () => {
    const types = NOTIFICATION_CATALOG.map((entry) => entry.type);
    expect(new Set(types).size).toBe(types.length);
    for (const type of types) expect(type).toMatch(TYPE_FORMAT);
  });

  describe.each(NOTIFICATION_CATALOG.map((entry) => [entry.type, entry] as const))('%s', (_, entry) => {
    it('has a title and body in every language', () => {
      for (const locale of LOCALES) {
        expect(entry.templates[locale].title.trim()).not.toBe('');
        expect(entry.templates[locale].body.trim()).not.toBe('');
      }
    });

    it('has an email subject and text in every language when it sends email', () => {
      if (!entry.channels.includes('EMAIL')) return;
      for (const locale of LOCALES) {
        expect(entry.templates[locale].emailSubject?.trim()).toBeTruthy();
        expect(entry.templates[locale].emailText?.trim()).toBeTruthy();
      }
    });

    it('uses the same placeholders in both languages, all declared', () => {
      const allowed = new Set([...entry.variables, 'full_name']);
      for (const key of ['title', 'body', 'emailSubject', 'emailText'] as const) {
        const [en, ar] = LOCALES.map((locale) => placeholdersOf(entry.templates[locale][key] ?? ''));
        expect(ar).toEqual(en);
        for (const name of en) expect(allowed.has(name)).toBe(true);
      }
    });

    it('renders with its declared variables', () => {
      const vars = Object.fromEntries([...entry.variables, 'full_name'].map((name) => [name, 'x']));
      for (const locale of LOCALES) {
        for (const text of Object.values(entry.templates[locale])) {
          expect(() => renderTemplate(text ?? '', vars)).not.toThrow();
        }
      }
    });
  });

  it('looks types up and refuses unknown ones', () => {
    expect(catalogEntry('account.password_changed').mandatory).toBe(true);
    expect(isKnownType('nope.nope')).toBe(false);
    expect(() => catalogEntry('nope.nope')).toThrow(/Unknown notification type/);
  });
});

describe('renderTemplate', () => {
  it('fills placeholders and lists them once', () => {
    expect(renderTemplate('Hi {{ name }}, {{name}} has {{count}}', { name: 'Sara', count: 3 })).toBe(
      'Hi Sara, Sara has 3',
    );
    expect(placeholdersOf('{{b}} {{a}} {{b}}')).toEqual(['a', 'b']);
  });

  it('throws on a missing variable', () => {
    expect(() => renderTemplate('Hi {{name}}', {})).toThrow(/"name" is missing/);
  });
});
