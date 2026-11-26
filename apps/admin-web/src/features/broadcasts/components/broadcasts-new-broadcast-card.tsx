import { Users, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type {
  AudienceRule,
  BroadcastChannelId,
  BroadcastEditorLocale,
  BroadcastMessageContent,
} from '@/features/broadcasts/types/broadcasts.types'

const CHANNELS: readonly BroadcastChannelId[] = ['push', 'email', 'inApp']

const fieldClassName =
  'h-10 w-full rounded-xl border border-border bg-background shadow-none focus-visible:border-ring'

type BroadcastsNewBroadcastCardProps = {
  audienceRules: readonly AudienceRule[]
  audienceMatchCount: number
  defaultChannels: Record<BroadcastChannelId, boolean>
  draftMessage: BroadcastMessageContent
  isLoading?: boolean
}

export function BroadcastsNewBroadcastCard({
  isLoading = false,
  ...props
}: BroadcastsNewBroadcastCardProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card className="flex min-w-0 flex-col gap-0 overflow-hidden border-[1.5px] border-primary/40 py-0 shadow-sm">
        <CardContent className="flex flex-1 flex-col px-5 py-4">
          <FormSkeleton fields={6} label={t('broadcasts.states.loading')} />
        </CardContent>
      </Card>
    )
  }

  return <BroadcastsNewBroadcastCardLoaded {...props} />
}

function BroadcastsNewBroadcastCardLoaded({
  audienceRules,
  audienceMatchCount,
  defaultChannels,
  draftMessage,
}: Omit<BroadcastsNewBroadcastCardProps, 'isLoading'>) {
  const { t, i18n } = useTranslation()

  const [rules, setRules] = useState(() => [...audienceRules])
  const [channels, setChannels] = useState(defaultChannels)
  const [locale, setLocale] = useState<BroadcastEditorLocale>('en')
  const [message, setMessage] = useState<BroadcastMessageContent>(() => ({
    en: { ...draftMessage.en },
    ar: { ...draftMessage.ar },
  }))

  const content = message[locale]

  const toggleChannel = (id: BroadcastChannelId) => {
    setChannels((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Card className="flex min-w-0 flex-col gap-0 overflow-hidden border-[1.5px] border-primary/40 py-0 shadow-sm">
      <CardContent className="flex flex-1 flex-col gap-[11px] px-5 py-4">
        <h2 className="text-[15px] font-bold tracking-tight text-foreground">
          {t('broadcasts.newBroadcast.title')}
        </h2>

        <section className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground">
            {t('broadcasts.newBroadcast.audienceLabel')}
          </Label>

          <div className="flex flex-col gap-1.5">
            {rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-10 shrink-0 text-[11px] font-bold text-muted-foreground">
                  {index > 0 ? t('broadcasts.audience.and') : null}
                </span>
                <span className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] border border-border bg-background px-2.5 font-medium">
                  <b className="font-bold text-foreground">
                    {t(`broadcasts.audience.fields.${rule.fieldKey}`)}
                  </b>
                  <span className="text-muted-foreground">
                    {t(`broadcasts.audience.operators.${rule.operatorKey}`)}
                  </span>
                  <b className="font-bold text-primary">
                    {t(`broadcasts.audience.values.${rule.valueKey}`)}
                  </b>
                  <button
                    type="button"
                    className="ms-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label={t('broadcasts.audience.removeRule')}
                    onClick={() => {
                      setRules((prev) => prev.filter((item) => item.id !== rule.id))
                    }}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="link"
            className="h-auto ps-12 pe-0 text-[13px] font-bold text-primary"
            onClick={() => {
              toast.message(t('broadcasts.toasts.addRule'))
            }}
          >
            {t('broadcasts.audience.addRule')}
          </Button>

          <div
            role="note"
            className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-3 py-2.5 text-[13px] leading-snug text-foreground"
          >
            <Users
              className="size-[18px] shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              <b className="font-bold tabular-nums">
                {audienceMatchCount.toLocaleString(i18n.language)}
              </b>{' '}
              {t('broadcasts.audience.matchBannerRest')}
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground">
            {t('broadcasts.newBroadcast.channelsLabel')}
          </Label>
          <div
            role="group"
            aria-label={t('broadcasts.newBroadcast.channelsLabel')}
            className="flex gap-2"
          >
            {CHANNELS.map((channelId) => {
              const selected = channels[channelId]
              return (
                <button
                  key={channelId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleChannel(channelId)}
                  className={cn(
                    'flex h-[38px] flex-1 items-center justify-between rounded-xl border-[1.5px] px-3 text-[12.5px] font-bold transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{t(`broadcasts.channels.${channelId}`)}</span>
                  <span aria-hidden="true" className="text-sm leading-none">
                    {selected ? '✓' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              {t('broadcasts.newBroadcast.messageLabel')}
            </span>
            <div
              role="tablist"
              aria-label={t('broadcasts.editor.languageLabel')}
              className="inline-flex items-center gap-1 rounded-[22px] bg-primary/10 p-1"
            >
              {(['en', 'ar'] as const).map((lang) => {
                const selected = locale === lang
                return (
                  <button
                    key={lang}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setLocale(lang)}
                    className={cn(
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-2xl px-3.5 text-xs font-bold transition-colors',
                      selected
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {lang === 'en'
                      ? t('broadcasts.editor.locales.en')
                      : t('broadcasts.editor.locales.ar')}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="flex flex-col gap-[11px]"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            lang={locale}
          >
            <Label htmlFor="broadcast-title" className="sr-only">
              {t('broadcasts.editor.title')}
            </Label>
            <Input
              id="broadcast-title"
              value={content.title}
              onChange={(event) => {
                const value = event.target.value
                setMessage((prev) => ({
                  ...prev,
                  [locale]: { ...prev[locale], title: value },
                }))
              }}
              className={cn(fieldClassName, 'text-[14px] font-bold')}
            />

            <Label htmlFor="broadcast-body" className="sr-only">
              {t('broadcasts.editor.body')}
            </Label>
            <Textarea
              id="broadcast-body"
              value={content.body}
              onChange={(event) => {
                const value = event.target.value
                setMessage((prev) => ({
                  ...prev,
                  [locale]: { ...prev[locale], body: value },
                }))
              }}
              rows={3}
              className="min-h-[5.5rem] w-full resize-y rounded-xl border border-border bg-background text-[13px] leading-relaxed shadow-none focus-visible:border-ring"
            />
          </div>
        </section>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-3 border-t border-border bg-muted/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm flex-1 text-[12px] leading-snug text-muted-foreground">
          {t('broadcasts.newBroadcast.scheduleHint')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-primary px-4 font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
            onClick={() => {
              toast.message(t('broadcasts.toasts.sendTest'))
            }}
          >
            {t('broadcasts.actions.sendTest')}
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full px-5 font-bold shadow-none"
            onClick={() => {
              toast.message(t('broadcasts.toasts.schedule'))
            }}
          >
            {t('broadcasts.actions.schedule')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
