/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local News admin scaffolding aligned to the product reference.
 * NOT production editorial data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import type { NewsStoriesData, NewsStory } from '@/features/news/types/news.types'

/** Night skyline + fireworks — matches the reference cover. */
const RIYADH_COVER =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80'
const RIYADH_THUMB =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=70'
const JEDDAH_THUMB =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=200&q=70'
const VOLUNTEER_THUMB =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=70'
const SAFETY_THUMB =
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=70'
const SUPPLIER_THUMB =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=200&q=70'

const RIYADH_BODY_EN = `Riyadh Season 2026 is hiring for 1,200 crew roles across stage, guest services and technical production. Applications open this week for students and freelancers.

Roles include stage managers, AV technicians, guest hosts and overnight load-in crews. Verified attendance at partner events still earns points as usual.`

const RIYADH_BODY_AR = `موسم الرياض 2026 يفتح التقديم على 1,200 دور طاقم عبر المسرح وخدمات الضيوف والإنتاج التقني. التقديم متاح هذا الأسبوع للطلاب والمستقلين.

تشمل الأدوار مديري المسرح وفنيي الصوت والصورة ومستضيفي الضيوف وطواقم التركيب الليلي. الحضور الموثّق في فعاليات الشركاء ما زال يمنح نقاطًا كالمعتاد.`

export const NEWS_MOCK_STORIES: readonly NewsStory[] = [
  {
    id: 'riyadh-season-2026',
    titleKey: 'riyadhSeason2026',
    statusId: 'draft',
    metaKey: 'authorNora',
    thumbnailClass: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400',
    coverClass: 'bg-gradient-to-r from-indigo-900 via-purple-800 to-amber-600',
    coverImageUrl: RIYADH_COVER,
    thumbnailImageUrl: RIYADH_THUMB,
    categoryId: 'opportunities',
    linkToKey: 'eventCoordinatorListing',
    notifyKey: 'pushRiyadhMembers',
    content: {
      en: {
        headline: 'Riyadh Season 2026 opens 1,200 crew roles',
        body: RIYADH_BODY_EN,
      },
      ar: {
        headline: 'موسم الرياض 2026 يفتح 1,200 دور طاقم',
        body: RIYADH_BODY_AR,
      },
    },
  },
  {
    id: 'jeddah-design-week',
    titleKey: 'jeddahDesignWeek',
    statusId: 'published',
    metaKey: 'publishedSep22Reads',
    thumbnailClass: 'bg-gradient-to-br from-teal-400 to-emerald-700',
    coverClass: 'bg-gradient-to-r from-slate-800 via-teal-900 to-emerald-800',
    thumbnailImageUrl: JEDDAH_THUMB,
    categoryId: 'culture',
    linkToKey: 'designWeekHub',
    notifyKey: 'none',
    content: {
      en: {
        headline: 'Jeddah Design Week wraps with 4,200 check-ins',
        body: 'Design Week closed with record verified attendance across four halls, with guest services and AV crews sharing a single check-in desk.',
      },
      ar: {
        headline: 'أسبوع جدة للتصميم يختتم بـ 4,200 تسجيل حضور',
        body: 'اختُتم أسبوع التصميم بحضور موثّق قياسي عبر أربع قاعات، مع مكتب تسجيل واحد لخدمات الضيوف وفرق الصوت والصورة.',
      },
    },
  },
  {
    id: 'volunteer-spotlight',
    titleKey: 'volunteerSpotlight',
    statusId: 'published',
    metaKey: 'publishedSep18Reads',
    thumbnailClass: 'bg-gradient-to-br from-amber-400 to-rose-500',
    coverClass: 'bg-gradient-to-r from-rose-900 via-amber-900 to-orange-800',
    thumbnailImageUrl: VOLUNTEER_THUMB,
    categoryId: 'community',
    linkToKey: 'volunteerProgram',
    notifyKey: 'none',
    content: {
      en: {
        headline: 'Volunteer of the month: Noura Alshehri',
        body: 'Noura led guest wayfinding across three Riyadh Season venues and mentored twelve first-time volunteers this month.',
      },
      ar: {
        headline: 'متطوعة الشهر: نورة الشهري',
        body: 'قادت نورة إرشاد الضيوف عبر ثلاثة مواقع في موسم الرياض ودرّبت اثني عشر متطوعًا للمرة الأولى هذا الشهر.',
      },
    },
  },
  {
    id: 'safety-briefing',
    titleKey: 'safetyBriefing',
    statusId: 'scheduled',
    metaKey: 'scheduledOct3',
    thumbnailClass: 'bg-gradient-to-br from-sky-400 to-blue-700',
    coverClass: 'bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800',
    thumbnailImageUrl: SAFETY_THUMB,
    categoryId: 'safety',
    linkToKey: 'safetyTraining',
    notifyKey: 'pushAllMembers',
    content: {
      en: {
        headline: 'Safety briefing: night-time load-in',
        body: 'A short briefing for overnight load-in crews covering lane closures, radio channels, and medical muster points.',
      },
      ar: {
        headline: 'إحاطة السلامة: التركيب الليلي',
        body: 'إحاطة قصيرة لطواقم التركيب الليلي تغطي إغلاق المسارات وقنوات اللاسلكي ونقاط التجمع الطبي.',
      },
    },
  },
  {
    id: 'supplier-spotlight',
    titleKey: 'supplierSpotlight',
    statusId: 'draft',
    metaKey: 'authorKhalid',
    thumbnailClass: 'bg-gradient-to-br from-zinc-400 to-zinc-700',
    coverClass: 'bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900',
    thumbnailImageUrl: SUPPLIER_THUMB,
    categoryId: 'opportunities',
    linkToKey: 'supplierPortal',
    notifyKey: 'none',
    content: {
      en: {
        headline: 'Supplier spotlight: Desert Stage AV',
        body: 'Desert Stage AV shares how they staff multi-day summits and keep backline kits ready for last-minute changeovers.',
      },
      ar: {
        headline: 'تسليط الضوء على مورد: Desert Stage AV',
        body: 'تستعرض Desert Stage AV كيف تجهّز طواقم القمم متعددة الأيام وتحافظ على جاهزية المعدات للتغييرات المفاجئة.',
      },
    },
  },
]

export const NEWS_MOCK_DATA: NewsStoriesData = {
  stories: NEWS_MOCK_STORIES,
}

/** @deprecated Prefer NEWS_NEW_DRAFT_TEMPLATE from lib/create-news-draft. */
export { NEWS_NEW_DRAFT_TEMPLATE } from '@/features/news/lib/create-news-draft'
