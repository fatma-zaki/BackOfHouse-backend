import { articlePlainText } from './article-html';

/** One language of an article as stored. */
export interface TranslationText {
  headline: string | null;
  excerpt: string | null;
  body: string | null;
}

/** Text the editor writes in both languages (`source`, each label); empty is `null` or "". */
export interface PairText {
  en?: string | null;
  ar?: string | null;
}

/** contracts/admin `ArticleCheck`. */
export interface ArticleCheck {
  key: 'BOTH_LANGUAGES' | 'COVER_ALT' | 'LINKED_ITEM_LIVE' | 'HEADLINE_LENGTH' | 'PARTNER_MENTION';
  result: 'PASS' | 'WARN' | 'FAIL';
  message: string;
}

/** Longer headlines are cut off on phones; 90 is the hard limit (contracts/admin). */
export const HEADLINE_WARN_AFTER = 70;

/**
 * What is missing for an article to be published, keyed by request field (`en.headline`,
 * `ar.body`, …): a headline and a body with visible text in both languages, and a topic.
 * A `source` or a label written in one language needs the other too. Empty when complete.
 */
export function translationGaps(article: {
  topic: string | null;
  en: TranslationText;
  ar: TranslationText;
  source?: PairText | null;
  labels?: PairText[];
}): Record<string, string[]> {
  const gaps: Record<string, string[]> = {};
  for (const lang of ['en', 'ar'] as const) {
    if (!article[lang].headline?.trim()) gaps[`${lang}.headline`] = ['is required to publish'];
    if (!articlePlainText(article[lang].body ?? '')) gaps[`${lang}.body`] = ['is required to publish'];
  }
  if (!article.topic) gaps['category'] = ['is required to publish'];
  pairGaps(gaps, 'source', article.source);
  (article.labels ?? []).forEach((label, i) => pairGaps(gaps, `labels.${i}`, label, true));
  return gaps;
}

/** Both languages or neither; a label (`always`) needs both. */
function pairGaps(gaps: Record<string, string[]>, key: string, pair: PairText | null | undefined, always = false) {
  const en = !!pair?.en?.trim();
  const ar = !!pair?.ar?.trim();
  if (!always && !en && !ar) return;
  if (!en) gaps[`${key}.en`] = ['is required to publish'];
  if (!ar) gaps[`${key}.ar`] = ['is required to publish'];
}

/** The checks that need nothing outside the article: languages, cover text, headline length. */
export function intrinsicChecks(article: {
  topic: string | null;
  en: TranslationText;
  ar: TranslationText;
  source?: PairText | null;
  labels?: PairText[];
  hasCover: boolean;
  coverAlt: { en: string | null; ar: string | null };
}): ArticleCheck[] {
  const gaps = Object.keys(translationGaps(article));
  const longest = Math.max(article.en.headline?.length ?? 0, article.ar.headline?.length ?? 0);
  const altMissing = !article.coverAlt.en?.trim() || !article.coverAlt.ar?.trim();
  return [
    gaps.length === 0
      ? { key: 'BOTH_LANGUAGES', result: 'PASS', message: 'English and Arabic are complete' }
      : { key: 'BOTH_LANGUAGES', result: 'FAIL', message: `Missing: ${gaps.join(', ')}` },
    !article.hasCover
      ? { key: 'COVER_ALT', result: 'PASS', message: 'No cover image, nothing to describe' }
      : altMissing
        ? { key: 'COVER_ALT', result: 'FAIL', message: 'The cover image needs alt text in both languages' }
        : { key: 'COVER_ALT', result: 'PASS', message: 'The cover image has alt text' },
    longest > HEADLINE_WARN_AFTER
      ? {
          key: 'HEADLINE_LENGTH',
          result: 'WARN',
          message: `A headline has ${longest} characters; over ${HEADLINE_WARN_AFTER} is cut off on phones`,
        }
      : { key: 'HEADLINE_LENGTH', result: 'PASS', message: 'Headlines fit on phones' },
  ];
}

/** A public handle: the Latin letters of the English headline, then the id prefix. */
export function articleSlug(headlineEn: string | null, id: string): string {
  const latin = (headlineEn ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${latin || 'article'}-${id.slice(0, 8).toLowerCase()}`;
}
