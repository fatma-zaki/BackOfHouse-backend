/**
 * Local async adapter over News mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { NEWS_MOCK_STORIES } from '@/features/news/mocks/news.mock'
import type { NewsStoriesData } from '@/features/news/types/news.types'

const MOCK_LATENCY_MS = 140

export async function getNewsStories(): Promise<NewsStoriesData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    stories: NEWS_MOCK_STORIES.map((story) => ({
      ...story,
      content: {
        en: { ...story.content.en },
        ar: { ...story.content.ar },
      },
    })),
  }
}
