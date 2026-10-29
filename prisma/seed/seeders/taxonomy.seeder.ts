import type { PrismaClient } from '../../../src/generated/prisma/client';

/**
 * Taxonomy seed data (database-entities.md §4, decided mapping 2026-10-29).
 * Regions and cities are geography and are seeded everywhere. Crafts and industries
 * are product lists still under review (BQ-21, RG-28), so they are seeded in local
 * and test only, as working samples. Upserts by slug: existing rows are not changed.
 */

type Named = { slug: string; en: string; ar: string };

/** The 13 administrative regions of Saudi Arabia with their main cities. */
export const SAUDI_REGIONS: readonly (Named & { cities: readonly Named[] })[] = [
  {
    slug: 'riyadh-region',
    en: 'Riyadh Region',
    ar: 'منطقة الرياض',
    cities: [
      { slug: 'riyadh', en: 'Riyadh', ar: 'الرياض' },
      { slug: 'al-kharj', en: 'Al Kharj', ar: 'الخرج' },
      { slug: 'diriyah', en: 'Diriyah', ar: 'الدرعية' },
    ],
  },
  {
    slug: 'makkah-region',
    en: 'Makkah Region',
    ar: 'منطقة مكة المكرمة',
    cities: [
      { slug: 'jeddah', en: 'Jeddah', ar: 'جدة' },
      { slug: 'makkah', en: 'Makkah', ar: 'مكة المكرمة' },
      { slug: 'taif', en: 'Taif', ar: 'الطائف' },
    ],
  },
  {
    slug: 'madinah-region',
    en: 'Madinah Region',
    ar: 'منطقة المدينة المنورة',
    cities: [
      { slug: 'madinah', en: 'Madinah', ar: 'المدينة المنورة' },
      { slug: 'yanbu', en: 'Yanbu', ar: 'ينبع' },
      { slug: 'alula', en: 'AlUla', ar: 'العلا' },
    ],
  },
  {
    slug: 'eastern-province',
    en: 'Eastern Province',
    ar: 'المنطقة الشرقية',
    cities: [
      { slug: 'dammam', en: 'Dammam', ar: 'الدمام' },
      { slug: 'khobar', en: 'Khobar', ar: 'الخبر' },
      { slug: 'dhahran', en: 'Dhahran', ar: 'الظهران' },
      { slug: 'al-ahsa', en: 'Al Ahsa', ar: 'الأحساء' },
      { slug: 'jubail', en: 'Jubail', ar: 'الجبيل' },
    ],
  },
  {
    slug: 'asir-region',
    en: 'Asir Region',
    ar: 'منطقة عسير',
    cities: [
      { slug: 'abha', en: 'Abha', ar: 'أبها' },
      { slug: 'khamis-mushait', en: 'Khamis Mushait', ar: 'خميس مشيط' },
    ],
  },
  { slug: 'tabuk-region', en: 'Tabuk Region', ar: 'منطقة تبوك', cities: [{ slug: 'tabuk', en: 'Tabuk', ar: 'تبوك' }] },
  {
    slug: 'qassim-region',
    en: 'Qassim Region',
    ar: 'منطقة القصيم',
    cities: [
      { slug: 'buraydah', en: 'Buraydah', ar: 'بريدة' },
      { slug: 'unaizah', en: 'Unaizah', ar: 'عنيزة' },
    ],
  },
  { slug: 'hail-region', en: 'Hail Region', ar: 'منطقة حائل', cities: [{ slug: 'hail', en: 'Hail', ar: 'حائل' }] },
  {
    slug: 'jazan-region',
    en: 'Jazan Region',
    ar: 'منطقة جازان',
    cities: [{ slug: 'jazan', en: 'Jazan', ar: 'جازان' }],
  },
  {
    slug: 'najran-region',
    en: 'Najran Region',
    ar: 'منطقة نجران',
    cities: [{ slug: 'najran', en: 'Najran', ar: 'نجران' }],
  },
  {
    slug: 'al-bahah-region',
    en: 'Al Bahah Region',
    ar: 'منطقة الباحة',
    cities: [{ slug: 'al-bahah', en: 'Al Bahah', ar: 'الباحة' }],
  },
  {
    slug: 'al-jawf-region',
    en: 'Al Jawf Region',
    ar: 'منطقة الجوف',
    cities: [{ slug: 'sakaka', en: 'Sakaka', ar: 'سكاكا' }],
  },
  {
    slug: 'northern-borders-region',
    en: 'Northern Borders Region',
    ar: 'منطقة الحدود الشمالية',
    cities: [{ slug: 'arar', en: 'Arar', ar: 'عرعر' }],
  },
];

/** Local/test samples only (BQ-21: the crafts list is not decided). */
const SAMPLE_CRAFTS: readonly Named[] = [
  { slug: 'stage-manager', en: 'Stage Manager', ar: 'مدير مسرح' },
  { slug: 'event-coordinator', en: 'Event Coordinator', ar: 'منسّق فعاليات' },
  { slug: 'production-manager', en: 'Production Manager', ar: 'مدير إنتاج' },
  { slug: 'lighting-technician', en: 'Lighting Technician', ar: 'فنّي إضاءة' },
  { slug: 'sound-engineer', en: 'Sound Engineer', ar: 'مهندس صوت' },
  { slug: 'rigger', en: 'Rigger', ar: 'فنّي تعليق ورفع' },
  { slug: 'hospitality-host', en: 'Hospitality Host', ar: 'مضيف ضيافة' },
];

/** Local/test only: the first entries of the draft industries list (RG-28, business-rules.md §20). */
const DRAFT_INDUSTRIES: readonly Named[] = [
  { slug: 'corporate-events', en: 'Corporate Events & Seminars', ar: 'فعاليات الشركات والندوات' },
  { slug: 'conferences-forums', en: 'Conferences, Forums & Summits', ar: 'المؤتمرات والمنتديات والقمم' },
  { slug: 'exhibitions-trade-shows', en: 'Exhibitions & Trade Shows', ar: 'المعارض التجارية والمعارض' },
  { slug: 'meetings-incentives', en: 'Meetings & Incentive Travel', ar: 'الاجتماعات ورحلات الحوافز' },
  { slug: 'brand-activations', en: 'Product Launches & Brand Activations', ar: 'إطلاق المنتجات والتفعيل التسويقي' },
  { slug: 'concerts-live-entertainment', en: 'Concerts & Live Entertainment', ar: 'الحفلات الموسيقية والترفيه الحي' },
];

/** Regions and cities (all environments). Returns how many rows were created. */
export async function seedLocations(prisma: PrismaClient): Promise<number> {
  let created = 0;
  for (const [regionIndex, region] of SAUDI_REGIONS.entries()) {
    const existing = await prisma.location.findUnique({ where: { slug: region.slug } });
    const regionRow =
      existing ??
      (await prisma.location.create({
        data: { type: 'REGION', slug: region.slug, nameEn: region.en, nameAr: region.ar, sortOrder: regionIndex },
      }));
    if (!existing) created += 1;
    for (const [cityIndex, city] of region.cities.entries()) {
      if (await prisma.location.findUnique({ where: { slug: city.slug } })) continue;
      await prisma.location.create({
        data: {
          type: 'CITY',
          parentId: regionRow.id,
          slug: city.slug,
          nameEn: city.en,
          nameAr: city.ar,
          sortOrder: regionIndex * 10 + cityIndex,
        },
      });
      created += 1;
    }
  }
  return created;
}

/** Sample crafts and draft industries (local and test only). */
export async function seedSampleTaxonomy(prisma: PrismaClient): Promise<number> {
  let created = 0;
  for (const [index, craft] of SAMPLE_CRAFTS.entries()) {
    if (await prisma.skill.findUnique({ where: { slug: craft.slug } })) continue;
    await prisma.skill.create({ data: { slug: craft.slug, nameEn: craft.en, nameAr: craft.ar, sortOrder: index } });
    created += 1;
  }
  for (const [index, industry] of DRAFT_INDUSTRIES.entries()) {
    if (await prisma.industry.findUnique({ where: { slug: industry.slug } })) continue;
    await prisma.industry.create({
      data: { slug: industry.slug, nameEn: industry.en, nameAr: industry.ar, sortOrder: index },
    });
    created += 1;
  }
  return created;
}
