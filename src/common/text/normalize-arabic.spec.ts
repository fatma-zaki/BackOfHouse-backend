import { normalizeArabic } from './normalize-arabic';
import { NORMALIZE_ARABIC_FIXTURES } from './normalize-arabic.fixtures';

describe('normalizeArabic', () => {
  it.each(NORMALIZE_ARABIC_FIXTURES)('normalises %p to %p', (input, expected) => {
    expect(normalizeArabic(input)).toBe(expected);
  });

  it('is idempotent', () => {
    for (const [input] of NORMALIZE_ARABIC_FIXTURES) {
      const once = normalizeArabic(input);
      expect(normalizeArabic(once)).toBe(once);
    }
  });
});
