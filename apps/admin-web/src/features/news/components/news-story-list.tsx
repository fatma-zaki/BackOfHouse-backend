import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  NewsStory,
  NewsStoryStatusId,
  NewsTabId,
} from '@/features/news/types/news.types'

const TABS: readonly NewsTabId[] = [
  'all',
  'published',
  'scheduled',
  'drafts',
]

const STATUS_BADGE: Record<
  NewsStoryStatusId,
  'warning' | 'success' | 'info'
> = {
  draft: 'warning',
  published: 'success',
  scheduled: 'info',
}

type NewsStoryListProps = {
  tab: NewsTabId
  onTabChange: (tab: NewsTabId) => void
  rows: readonly NewsStory[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
}

export function NewsStoryList({
  tab,
  onTabChange,
  rows,
  selectedId,
  isLoading = false,
  onSelect,
}: NewsStoryListProps) {
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.resolvedLanguage?.startsWith('ar') ? 'ar' : 'en'

  const storyHeadline = (story: NewsStory) => {
    const live = story.content[uiLocale]?.headline?.trim()
    if (live) return live
    return t(`news.stories.${story.titleKey}`)
  }

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="flex flex-col gap-0 px-0 py-0">
        <div className="border-b border-border px-3 py-3">
          <div
            role="tablist"
            aria-label={t('news.tabs.label')}
            className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((tabId) => {
              const selected = tab === tabId
              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(tabId)}
                  className={cn(
                    'h-8 shrink-0 rounded-2xl px-3 text-xs font-bold whitespace-nowrap transition-colors',
                    selected
                      ? 'bg-card text-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`news.tabs.${tabId}`)}
                </button>
              )
            })}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={5} label={t('news.states.loading')} />
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('news.states.emptyList')}
          </p>
        ) : (
          <ul className="flex flex-col" aria-label={t('news.listLabel')}>
            {rows.map((story) => {
              const active = story.id === selectedId
              return (
                <li key={story.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(story.id)}
                    className={cn(
                      'flex w-full gap-3 border-b border-border px-3 py-3.5 text-start transition-colors last:border-b-0',
                      'border-s-[3px] border-s-transparent hover:bg-muted/35',
                      active &&
                        'border-s-primary bg-primary/8 hover:bg-primary/8',
                    )}
                  >
                    {story.thumbnailImageUrl ? (
                      <img
                        src={story.thumbnailImageUrl}
                        alt=""
                        className="size-[3.25rem] shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          'size-[3.25rem] shrink-0 rounded-lg',
                          story.thumbnailClass,
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="line-clamp-2 block text-[13px] leading-snug font-bold text-foreground">
                        {storyHeadline(story)}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge
                          status={STATUS_BADGE[story.statusId]}
                          className="h-5 rounded-full px-2 text-[10px] font-bold"
                        >
                          {t(`news.statuses.${story.statusId}`)}
                        </StatusBadge>
                        <span className="text-[11px] text-muted-foreground">
                          {t(`news.meta.${story.metaKey}`)}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
