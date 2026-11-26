import { useQuery } from '@tanstack/react-query'
import { getNewsStories } from '@/features/news/api/get-news-stories'
import { newsKeys } from '@/features/news/query-keys'

export function useNewsDashboard(enabled = true) {
  return useQuery({
    queryKey: newsKeys.stories(),
    queryFn: () => getNewsStories(),
    enabled,
  })
}
