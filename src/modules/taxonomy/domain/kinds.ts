import type { LocalizedText } from '../../../common/i18n/locale';

/**
 * Taxonomy kinds (decided 2026-10-29, open-questions.md §0). Names follow the app
 * contract's vocabulary (D1). Table kinds have their own table and staff may add,
 * rename, reorder and deactivate items. Fixed kinds are code lists the app and the
 * rules depend on: staff may rename and reorder them, never add or remove a code.
 */
export const TABLE_KINDS = ['cities', 'crafts', 'industries'] as const;
export const FIXED_KINDS = ['company_types', 'opportunity_types', 'news_topics'] as const;

export type TableKind = (typeof TABLE_KINDS)[number];
export type FixedKind = (typeof FIXED_KINDS)[number];
export type TaxonomyKind = TableKind | FixedKind;

export const TAXONOMY_KINDS: readonly TaxonomyKind[] = [...TABLE_KINDS, ...FIXED_KINDS];

export function isTaxonomyKind(value: string): value is TaxonomyKind {
  return (TAXONOMY_KINDS as readonly string[]).includes(value);
}

export function isFixedKind(kind: TaxonomyKind): kind is FixedKind {
  return (FIXED_KINDS as readonly string[]).includes(kind);
}

/**
 * Codes and default labels of the fixed lists, in default order. The codes are the
 * enums of contracts/app (CompanyType, OpportunityType, NewsTopic). PROJECT is an
 * opportunity type in both contracts while BQ-81 is open.
 */
export const FIXED_LISTS: Record<FixedKind, readonly { code: string; name: LocalizedText }[]> = {
  company_types: [
    { code: 'EVENT_ORGANIZER', name: { en: 'Event organizer', ar: 'منظّم فعاليات' } },
    { code: 'SUPPLIER', name: { en: 'Supplier', ar: 'مورّد' } },
    { code: 'VENUE', name: { en: 'Venue', ar: 'مكان فعاليات' } },
    { code: 'PRODUCTION', name: { en: 'Production', ar: 'إنتاج' } },
    { code: 'AGENCY', name: { en: 'Agency', ar: 'وكالة' } },
    { code: 'SERVICE_PROVIDER', name: { en: 'Service provider', ar: 'مقدّم خدمات' } },
    { code: 'OTHER', name: { en: 'Other', ar: 'أخرى' } },
  ],
  opportunity_types: [
    { code: 'JOB', name: { en: 'Job', ar: 'وظيفة' } },
    { code: 'PROJECT', name: { en: 'Project', ar: 'مشروع' } },
    { code: 'CO_OP', name: { en: 'Co-op training', ar: 'تدريب تعاوني' } },
    { code: 'VOLUNTEERING', name: { en: 'Volunteering', ar: 'تطوّع' } },
    { code: 'SUPPLIER_REQUEST', name: { en: 'Supplier request', ar: 'طلب مورّدين' } },
  ],
  news_topics: [
    { code: 'TECHNICAL', name: { en: 'Technical', ar: 'تقني' } },
    { code: 'REGULATORY', name: { en: 'Regulatory', ar: 'تنظيمي' } },
    { code: 'MARKET', name: { en: 'Market', ar: 'السوق' } },
  ],
};

/** Fixed audit entity id per kind (audit rows need a UUID entity id). */
export const TAXONOMY_ENTITY_IDS: Record<TaxonomyKind, string> = {
  cities: '00000000-0000-7000-8000-0000000000a1',
  crafts: '00000000-0000-7000-8000-0000000000a2',
  industries: '00000000-0000-7000-8000-0000000000a3',
  company_types: '00000000-0000-7000-8000-0000000000a4',
  opportunity_types: '00000000-0000-7000-8000-0000000000a5',
  news_topics: '00000000-0000-7000-8000-0000000000a6',
};

/**
 * URL slug from an English name: lowercase ASCII words joined by `-`
 * ("Stage Manager" → "stage-manager"). Empty when the name has no ASCII letters.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** First free slug: `base`, `base-2`, `base-3` … */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || 'item';
  if (!taken.has(root)) return root;
  for (let n = 2; ; n += 1) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
