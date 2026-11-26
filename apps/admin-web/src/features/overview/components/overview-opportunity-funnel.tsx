import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/shared/empty-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  OverviewFunnel,
  OverviewFunnelStageId,
} from '@/features/overview/types/overview.types'
import { cn } from '@/lib/utils'

const STAGE_LABEL_KEYS: Record<OverviewFunnelStageId, string> = {
  listingViews: 'overview.funnel.stages.listingViews',
  applicationsStarted: 'overview.funnel.stages.applicationsStarted',
  submitted: 'overview.funnel.stages.submitted',
  shortlisted: 'overview.funnel.stages.shortlisted',
  selected: 'overview.funnel.stages.selected',
}

/** Stable business order — do not reverse for RTL. */
const STAGE_ORDER: readonly OverviewFunnelStageId[] = [
  'listingViews',
  'applicationsStarted',
  'submitted',
  'shortlisted',
  'selected',
] as const

type OverviewOpportunityFunnelProps = {
  funnel: OverviewFunnel | undefined
  isLoading?: boolean
  className?: string
}

function funnelBarWidthPercent(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) return 0
  return Math.min(100, (value / maxValue) * 100)
}

function formatConversionRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(rate)
}

export function OverviewOpportunityFunnel({
  funnel,
  isLoading = false,
  className,
}: OverviewOpportunityFunnelProps) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'

  const hasSourceStages = (funnel?.stages.length ?? 0) > 0

  const stages = useMemo(() => {
    if (!hasSourceStages) return []
    const byId = new Map(funnel!.stages.map((stage) => [stage.id, stage]))
    return STAGE_ORDER.map((id) => ({
      id,
      value: byId.get(id)?.value ?? 0,
    }))
  }, [funnel, hasSourceStages])

  const maxValue = useMemo(
    () => Math.max(...stages.map((stage) => stage.value), 0),
    [stages],
  )

  const conversionLabel =
    funnel != null && funnel.conversionRatePercent != null
      ? t('overview.funnel.conversion', {
          rate: formatConversionRate(funnel.conversionRatePercent, numberLocale),
        })
      : null

  return (
    <Card className={cn('min-w-0 overflow-visible shadow-sm', className)}>
      <CardHeader className="gap-1">
        <CardTitle className="text-base font-bold text-foreground">
          {t('overview.funnel.title')}
        </CardTitle>
        {!isLoading && conversionLabel ? (
          <CardDescription className="text-xs leading-normal">
            {conversionLabel}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ListSkeleton
            rows={5}
            showAvatar={false}
            label={t('overview.states.loading')}
          />
        ) : !hasSourceStages ? (
          <EmptyState
            title={t('overview.funnel.emptyTitle')}
            description={t('overview.funnel.emptyDescription')}
            className="py-6"
          />
        ) : (
          <ul
            className="flex flex-col gap-3.5"
            aria-label={t('overview.funnel.title')}
          >
            {stages.map((stage, index) => {
              const label = t(STAGE_LABEL_KEYS[stage.id])
              const valueLabel = new Intl.NumberFormat(numberLocale).format(
                stage.value,
              )
              const widthPercent = funnelBarWidthPercent(stage.value, maxValue)

              return (
                <li
                  key={stage.id}
                  className="grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center sm:gap-3"
                >
                  <span className="text-sm leading-snug break-words text-foreground">
                    {label}
                  </span>

                  <div
                    className="h-2.5 min-w-0 overflow-hidden rounded-full bg-primary/10"
                    role="meter"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={maxValue}
                    aria-valuenow={stage.value}
                    aria-valuetext={`${label}: ${valueLabel}`}
                  >
                    <motion.div
                      className="h-full origin-inline-start rounded-full bg-primary"
                      initial={
                        reduceMotion
                          ? { width: `${widthPercent}%` }
                          : { width: 0 }
                      }
                      whileInView={{ width: `${widthPercent}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.7,
                              delay: index * 0.08,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                    />
                  </div>

                  <span className="text-sm font-bold tabular-nums text-foreground sm:min-w-14 sm:text-end">
                    {valueLabel}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
