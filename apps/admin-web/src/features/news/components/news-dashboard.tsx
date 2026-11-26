import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/error-state'
import { NewsHeader } from '@/features/news/components/news-header'
import { NewsStoryEditor } from '@/features/news/components/news-story-editor'
import { NewsStoryList } from '@/features/news/components/news-story-list'
import { useNewsDashboard } from '@/features/news/hooks/use-news-dashboard'
import { filterNewsStories } from '@/features/news/lib/filter-news-stories'
import { NEWS_NEW_DRAFT_TEMPLATE } from '@/features/news/lib/create-news-draft'
import type {
  NewsEditorLocale,
  NewsStory,
  NewsTabId,
} from '@/features/news/types/news.types'

function mergeStoryEdits(
  base: NewsStory,
  patch: Partial<NewsStory> | undefined,
): NewsStory {
  if (!patch) return base
  return {
    ...base,
    ...patch,
    content: patch.content
      ? {
          en: { ...base.content.en, ...patch.content.en },
          ar: { ...base.content.ar, ...patch.content.ar },
        }
      : base.content,
  }
}

export function NewsDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useNewsDashboard()

  const [tab, setTab] = useState<NewsTabId>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorLocale, setEditorLocale] = useState<NewsEditorLocale>('en')
  const [extraStories, setExtraStories] = useState<NewsStory[]>([])
  const [editsById, setEditsById] = useState<
    Record<string, Partial<NewsStory>>
  >({})

  const baseRows = useMemo(() => {
    const fromApi = data?.stories ?? []
    return [...fromApi, ...extraStories]
  }, [data?.stories, extraStories])

  const rows = useMemo(
    () => baseRows.map((story) => mergeStoryEdits(story, editsById[story.id])),
    [baseRows, editsById],
  )

  const visibleRows = useMemo(
    () => filterNewsStories(rows, tab),
    [rows, tab],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ??
    visibleRows[0] ??
    null

  const effectiveSelectedId = selected?.id ?? null

  const patchStory = useCallback((id: string, patch: Partial<NewsStory>) => {
    setEditsById((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
        content: patch.content
          ? {
              ...(prev[id]?.content ?? {}),
              en: {
                ...(prev[id]?.content?.en ?? {}),
                ...patch.content.en,
              },
              ar: {
                ...(prev[id]?.content?.ar ?? {}),
                ...patch.content.ar,
              },
            }
          : prev[id]?.content,
      },
    }))
  }, [])

  const handleNewStory = () => {
    const id = `draft-${Date.now()}`
    const draft: NewsStory = {
      ...NEWS_NEW_DRAFT_TEMPLATE,
      id,
    }
    setExtraStories((prev) => [draft, ...prev])
    setTab('drafts')
    setSelectedId(id)
    setEditorLocale('en')
    toast.message(t('news.toasts.newDraft'))
  }

  return (
    <div className="flex flex-col gap-4">
      <NewsHeader onNewStory={handleNewStory} />

      {!isPending && isError ? (
        <ErrorState
          title={t('news.states.errorTitle')}
          description={t('news.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(18rem,21.5rem)_minmax(0,1fr)]">
          <NewsStoryList
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            rows={visibleRows}
            selectedId={effectiveSelectedId}
            isLoading={isPending}
            onSelect={setSelectedId}
          />
          <NewsStoryEditor
            story={selected}
            isLoading={isPending}
            locale={editorLocale}
            onLocaleChange={setEditorLocale}
            onFieldChange={(loc, field, value) => {
              if (!selected) return
              patchStory(selected.id, {
                content: {
                  en: selected.content.en,
                  ar: selected.content.ar,
                  [loc]: {
                    ...selected.content[loc],
                    [field]: value,
                  },
                },
              })
            }}
            onCategoryChange={(categoryId) => {
              if (!selected) return
              patchStory(selected.id, { categoryId })
            }}
            onLinkToChange={(linkToKey) => {
              if (!selected) return
              patchStory(selected.id, { linkToKey })
            }}
            onNotifyChange={(notifyKey) => {
              if (!selected) return
              patchStory(selected.id, { notifyKey })
            }}
            onChangeCover={() => {
              toast.message(t('news.toasts.changeCover'))
            }}
            onPreview={() => {
              toast.message(t('news.toasts.preview'))
            }}
            onSchedule={() => {
              toast.message(t('news.toasts.schedule'))
            }}
            onPublish={() => {
              toast.message(t('news.toasts.publish'))
            }}
          />
        </div>
      )}
    </div>
  )
}
