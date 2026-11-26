import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { cn } from '@/lib/utils'
import type { AnalyticsMeterItem } from '@/features/analytics/types/analytics.types'

type AnalyticsMeterListProps = {
  items: readonly AnalyticsMeterItem[] | undefined
  labelNamespace: string
  isLoading?: boolean
  /** Cap for percentage-style meters (e.g. attendance). Omit to use max item value. */
  max?: number
  className?: string
}

function meterWidthPercent(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) return 0
  return Math.min(100, (value / maxValue) * 100)
}

/**
 * Horizontal meters: label · bar · value — matches the reference MeterList.
 */
export function AnalyticsMeterList({
  items,
  labelNamespace,
  isLoading = false,
  max,
  className,
}: AnalyticsMeterListProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'

  const maxValue = useMemo(() => {
    if (max != null) return max
    return Math.max(...(items ?? []).map((item) => item.value), 0)
  }, [items, max])

  if (isLoading) {
    return (
      <ListSkeleton
        rows={5}
        showAvatar={false}
        label={t('analytics.states.loading')}
      />
    )
  }

  if (!items || items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('analytics.states.emptyMeters')}
      </p>
    )
  }

  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {items.map((item) => {
        const label = t(`${labelNamespace}.${item.id}`)
        const display =
          item.display ??
          new Intl.NumberFormat(numberLocale).format(item.value)
        const width = meterWidthPercent(item.value, maxValue)

        return (
          <li
            key={item.id}
            className="grid grid-cols-[minmax(5.5rem,8.75rem)_minmax(0,1fr)_3.5rem] items-center gap-3 max-sm:grid-cols-[6rem_minmax(0,1fr)_3rem] max-sm:gap-2"
          >
            <span className="truncate text-xs font-bold text-foreground">
              {label}
            </span>
            <div
              className="h-3 overflow-hidden rounded bg-primary/10"
              role="meter"
              aria-label={label}
              aria-valuenow={item.value}
              aria-valuemin={0}
              aria-valuemax={maxValue}
              title={`${label}: ${display}`}
            >
              <div
                className="h-full min-w-1 rounded bg-primary transition-[width] duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-end text-xs font-bold tabular-nums text-foreground">
              {display}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
