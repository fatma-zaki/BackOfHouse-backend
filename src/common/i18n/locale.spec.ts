import { pickText, resolveLocale } from './locale';

describe('resolveLocale', () => {
  it.each([
    [undefined, 'en'],
    ['', 'en'],
    ['ar', 'ar'],
    ['ar-SA', 'ar'],
    ['AR-sa,en;q=0.8', 'ar'],
    ['en-US,ar;q=0.9', 'en'],
    ['fr-FR,ar;q=0.5', 'ar'],
    ['fr-FR,de;q=0.5', 'en'],
    ['en;q=0.2,ar;q=0.9', 'ar'],
    ['ar;q=0', 'en'],
    [['ar', 'en'], 'ar'],
  ])('%j → %s', (header, expected) => {
    expect(resolveLocale(header as string | string[] | undefined)).toBe(expected);
  });
});

describe('pickText', () => {
  it('returns the requested language, falling back to English when it is blank', () => {
    expect(pickText({ en: 'Riyadh', ar: 'الرياض' }, 'ar')).toBe('الرياض');
    expect(pickText({ en: 'Riyadh', ar: '  ' }, 'ar')).toBe('Riyadh');
    expect(pickText({ en: 'Riyadh', ar: 'الرياض' }, 'en')).toBe('Riyadh');
  });
});
