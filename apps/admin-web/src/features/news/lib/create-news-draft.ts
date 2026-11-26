import type { NewsStory } from '@/features/news/types/news.types'

/** Template for a newly created news draft (demo / local editor). */
export const NEWS_NEW_DRAFT_TEMPLATE: NewsStory = {
  id: 'draft-new',
  titleKey: 'untitledStory',
  statusId: 'draft',
  metaKey: 'authorYou',
  thumbnailClass: 'bg-gradient-to-br from-primary/40 to-primary/70',
  coverClass: 'bg-gradient-to-r from-primary/30 via-primary/50 to-violet-600/40',
  categoryId: 'opportunities',
  linkToKey: 'none',
  notifyKey: 'none',
  content: {
    en: { headline: '', body: '' },
    ar: { headline: '', body: '' },
  },
}
