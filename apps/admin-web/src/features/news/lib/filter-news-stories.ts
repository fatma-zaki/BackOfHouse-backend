import type { NewsStory, NewsTabId } from '@/features/news/types/news.types'

export function matchesNewsTab(story: NewsStory, tab: NewsTabId): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'published':
      return story.statusId === 'published'
    case 'scheduled':
      return story.statusId === 'scheduled'
    case 'drafts':
      return story.statusId === 'draft'
  }
}

export function filterNewsStories(
  rows: readonly NewsStory[],
  tab: NewsTabId,
): NewsStory[] {
  return rows.filter((row) => matchesNewsTab(row, tab))
}

export function hasArabicContent(story: NewsStory): boolean {
  const ar = story.content.ar
  return Boolean(ar.headline.trim() || ar.body.trim())
}
