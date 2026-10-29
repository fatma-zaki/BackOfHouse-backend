/**
 * Languages (docs/app/README.md "Localisation"). The app surface answers in one
 * language from `Accept-Language`; the admin surface exchanges both as
 * LocalizedText. English is the fallback.
 */
export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

/** Bilingual content as the admin surface sends and receives it (ADR-021). */
export interface LocalizedText {
  en: string;
  ar: string;
}

/**
 * Picks the language from an `Accept-Language` header: the first listed tag
 * we support wins (`ar-SA,en;q=0.8` → `ar`); anything else falls back to `en`.
 */
export function resolveLocale(header: string | string[] | undefined): Locale {
  const value = Array.isArray(header) ? header.join(',') : (header ?? '');
  const tags = value
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.split('-')[0], q: q ? Number(q.slice(2)) : 1 };
    })
    .filter(({ tag, q }) => tag && Number.isFinite(q) && q > 0)
    .sort((a, b) => b.q - a.q);
  const match = tags.find(({ tag }) => (LOCALES as readonly string[]).includes(tag));
  return (match?.tag as Locale | undefined) ?? 'en';
}

/** The text in the requested language, falling back to English when it is empty. */
export function pickText(text: LocalizedText, locale: Locale): string {
  return text[locale]?.trim() ? text[locale] : text.en;
}
