import {
  Bold,
  Check,
  Heading2,
  Italic,
  Link2,
  List,
  Quote,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { hasArabicContent } from '@/features/news/lib/filter-news-stories'
import { cn } from '@/lib/utils'
import type {
  NewsCategoryId,
  NewsEditorLocale,
  NewsStory,
} from '@/features/news/types/news.types'

const TOOLBAR_ITEMS = [
  { icon: Bold, labelKey: 'bold' as const },
  { icon: Italic, labelKey: 'italic' as const },
  { icon: Heading2, labelKey: 'heading' as const },
  { icon: Quote, labelKey: 'quote' as const },
  { icon: List, labelKey: 'list' as const },
  { icon: Link2, labelKey: 'link' as const },
]

const CATEGORIES: readonly NewsCategoryId[] = [
  'opportunities',
  'culture',
  'safety',
  'community',
]

const fieldClassName =
  'h-10 w-full rounded-xl border-transparent bg-muted/55 shadow-none focus-visible:border-ring'

type NewsStoryEditorProps = {
  story: NewsStory | null
  isLoading?: boolean
  locale: NewsEditorLocale
  onLocaleChange: (locale: NewsEditorLocale) => void
  onFieldChange: (
    locale: NewsEditorLocale,
    field: 'headline' | 'body',
    value: string,
  ) => void
  onCategoryChange: (categoryId: NewsCategoryId) => void
  onLinkToChange: (linkToKey: string) => void
  onNotifyChange: (notifyKey: string) => void
  onChangeCover: () => void
  onPreview: () => void
  onSchedule: () => void
  onPublish: () => void
}

export function NewsStoryEditor({
  story,
  isLoading = false,
  locale,
  onLocaleChange,
  onFieldChange,
  onCategoryChange,
  onLinkToChange,
  onNotifyChange,
  onChangeCover,
  onPreview,
  onSchedule,
  onPublish,
}: NewsStoryEditorProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card className="flex min-h-[32rem] min-w-0 flex-col overflow-hidden shadow-sm">
        <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
          <FormSkeleton fields={6} label={t('news.states.loading')} />
        </CardContent>
      </Card>
    )
  }

  if (!story) {
    return (
      <Card className="flex min-h-[32rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('news.states.pickStory')}
        </p>
      </Card>
    )
  }

  const content = story.content[locale]
  const arReady = hasArabicContent(story)

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden shadow-sm">
      <CardContent className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t('news.editor.languageLabel')}
            className="inline-flex items-center gap-1 rounded-[22px] bg-primary/10 p-1"
          >
            {(['en', 'ar'] as const).map((lang) => {
              const selected = locale === lang
              const showArCheck = lang === 'ar' && arReady
              return (
                <button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onLocaleChange(lang)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-2xl px-3.5 text-xs font-bold transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`news.editor.locales.${lang}`)}
                  {showArCheck ? (
                    <Check
                      className={cn(
                        'size-3.5 shrink-0',
                        selected ? 'text-primary-foreground' : 'text-primary',
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('news.editor.savedAgo')}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl">
          {story.coverImageUrl ? (
            <img
              src={story.coverImageUrl}
              alt={t('news.editor.coverAlt')}
              className="aspect-[2.35/1] max-h-56 w-full min-h-[11rem] object-cover"
            />
          ) : (
            <div
              className={cn(
                'aspect-[2.35/1] max-h-56 w-full min-h-[11rem]',
                story.coverClass,
              )}
              role="img"
              aria-label={t('news.editor.coverAlt')}
            />
          )}
          <Button
            type="button"
            size="sm"
            className="absolute end-3 bottom-3 h-8 rounded-lg border-0 bg-black/60 px-3 text-xs font-bold text-white shadow-none hover:bg-black/75 hover:text-white"
            onClick={onChangeCover}
          >
            {t('news.editor.changeCover')}
          </Button>
        </div>

        <div
          className="space-y-2"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          lang={locale}
        >
          <Label
            htmlFor="news-headline"
            className="text-xs font-bold text-muted-foreground"
          >
            {t('news.editor.headline')}
          </Label>
          <Input
            id="news-headline"
            value={content.headline}
            onChange={(event) =>
              onFieldChange(locale, 'headline', event.target.value)
            }
            className={cn(fieldClassName, 'text-[15px] font-bold')}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">
              {t('news.editor.category')}
            </Label>
            <Select
              value={story.categoryId}
              onValueChange={(value) =>
                onCategoryChange(value as NewsCategoryId)
              }
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(`news.categories.${id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">
              {t('news.editor.linkTo')}
            </Label>
            <Select value={story.linkToKey} onValueChange={onLinkToChange}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    'eventCoordinatorListing',
                    'designWeekHub',
                    'safetyTraining',
                    'volunteerProgram',
                    'supplierPortal',
                    'arenaTour',
                    'none',
                  ] as const
                ).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`news.linkTo.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">
              {t('news.editor.notify')}
            </Label>
            <Select value={story.notifyKey} onValueChange={onNotifyChange}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ['pushRiyadhMembers', 'pushAllMembers', 'none'] as const
                ).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`news.notify.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="space-y-2"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          lang={locale}
        >
          <Label className="text-xs font-bold text-muted-foreground">
            {t('news.editor.story')}
          </Label>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            <div
              className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/50 px-1.5 py-1"
              role="toolbar"
              aria-label={t('news.editor.toolbarLabel')}
            >
              {TOOLBAR_ITEMS.map(({ icon: Icon, labelKey }) => (
                <Button
                  key={labelKey}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-lg text-muted-foreground"
                  aria-label={t(`news.editor.tools.${labelKey}`)}
                  onClick={() => {
                    /* DEMO: styling-only toolbar */
                  }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </Button>
              ))}
            </div>
            <Textarea
              value={content.body}
              onChange={(event) =>
                onFieldChange(locale, 'body', event.target.value)
              }
              className="min-h-[12rem] resize-none rounded-none border-0 bg-transparent px-3.5 py-3 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
              aria-label={t('news.editor.story')}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-muted-foreground">
          {t('news.editor.publishHint')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-primary px-4 font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
            onClick={onPreview}
          >
            {t('news.actions.preview')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-primary px-4 font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
            onClick={onSchedule}
          >
            {t('news.actions.schedule')}
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full px-4 font-bold shadow-none"
            onClick={onPublish}
          >
            {t('news.actions.publish')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
