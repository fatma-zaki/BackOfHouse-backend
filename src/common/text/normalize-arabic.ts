/**
 * TypeScript twin of the SQL function `app.normalize_ar(text)`
 * (database-design-rules.md §13, ADR-012). Used on search input so that the
 * query and the indexed text are normalised identically. Both implementations
 * are tested against the same fixtures (normalize-arabic.fixtures.ts).
 */

const ARABIC_LETTER_MAP: Readonly<Record<string, string>> = {
  أ: 'ا', // alef with hamza above
  إ: 'ا', // alef with hamza below
  آ: 'ا', // alef with madda
  ٱ: 'ا', // alef wasla
  ؤ: 'و', // waw with hamza
  ئ: 'ي', // yeh with hamza
  ى: 'ي', // alef maksura
  ة: 'ه', // ta marbuta
};

/** Tashkeel (fathatan … sukun), superscript alef, and tatweel. */
const ARABIC_MARKS = /[\u064B-\u0652\u0670\u0640]/g;

/**
 * Latin letters that PostgreSQL `unaccent` expands but Unicode decomposition
 * does not. Kept small and covered by fixtures.
 */
const LATIN_EXPANSIONS: Readonly<Record<string, string>> = {
  ß: 'ss',
  æ: 'ae',
  Æ: 'AE',
  œ: 'oe',
  Œ: 'OE',
  ø: 'o',
  Ø: 'O',
  ł: 'l',
  Ł: 'L',
  đ: 'd',
  Đ: 'D',
};

function stripLatinAccents(value: string): string {
  const expanded = value.replace(/[ßæÆœŒøØłŁđĐ]/g, (char) => LATIN_EXPANSIONS[char] ?? char);
  // Decompose, drop combining marks only for Latin-script base letters, recompose.
  return expanded
    .normalize('NFD')
    .replace(/([A-Za-z])[\u0300-\u036f]+/g, '$1')
    .normalize('NFC');
}

export function normalizeArabic(input: string): string {
  const unified = [...input].map((char) => ARABIC_LETTER_MAP[char] ?? char).join('');
  const withoutMarks = unified.replace(ARABIC_MARKS, '');
  return stripLatinAccents(withoutMarks).toLowerCase().replace(/\s+/g, ' ').trim();
}
