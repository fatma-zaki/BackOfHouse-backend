import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartSkeleton } from '@/components/shared/chart-skeleton'
import { AnalyticsSectionCard } from '@/features/analytics/components/analytics-section-card'
import { downloadCsv } from '@/features/analytics/lib/download-csv'
import type { AnalyticsWeeklyPoint } from '@/features/analytics/types/analytics.types'
import { cn } from '@/lib/utils'

const Y_MAX = 10000
const Y_TICKS = [0, 2500, 5000, 7500, 10000] as const
const BAR_MUTED = 'color-mix(in srgb, var(--chart-1) 42%, transparent)'
const BAR_EMPHASIS = 'var(--chart-1)'

/** Sparse x-axis tick weeks matching the reference labels. */
const X_TICK_WEEKS = new Set([1, 4, 7, 10, 12])

type AnalyticsWeeklyActiveChartProps = {
  weeklyActive: readonly AnalyticsWeeklyPoint[] | undefined
  isLoading?: boolean
  className?: string
}

type ChartRow = {
  week: number
  value: number
  label: string
  isLast: boolean
}

type TooltipPayloadItem = {
  payload?: ChartRow
}

function WeeklyTooltip({
  active,
  payload,
  numberLocale,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  numberLocale: string
}) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium text-foreground">{row.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        {t('analytics.weeklyActive.tooltip', {
          count: new Intl.NumberFormat(numberLocale).format(row.value),
        })}
      </p>
    </div>
  )
}

export function AnalyticsWeeklyActiveChart({
  weeklyActive,
  isLoading = false,
  className,
}: AnalyticsWeeklyActiveChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'

  const formatYTick = (value: number): string =>
    new Intl.NumberFormat(numberLocale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)

  const chartData = useMemo<ChartRow[]>(() => {
    const points = weeklyActive ?? []
    return points.map((point, index) => ({
      week: point.week,
      value: point.value,
      label: t('analytics.weeklyActive.weekLabel', { week: point.week }),
      isLast: index === points.length - 1,
    }))
  }, [weeklyActive, t])

  const handleDownload = () => {
    downloadCsv(
      'weekly-active-users',
      chartData.map((row) => ({
        week: row.week,
        active_users: row.value,
      })),
    )
  }

  return (
    <AnalyticsSectionCard
      title={t('analytics.weeklyActive.title')}
      description={t('analytics.weeklyActive.subtitle')}
      action={
        <button
          type="button"
          className="text-xs font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          onClick={handleDownload}
          disabled={isLoading || chartData.length === 0}
        >
          {t('analytics.actions.downloadCsv')}
        </button>
      }
      className={cn(className)}
    >
      {isLoading ? (
        <ChartSkeleton
          heightClassName="h-[180px] sm:h-[200px]"
          label={t('analytics.states.loading')}
        />
      ) : chartData.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('analytics.states.emptyChart')}
        </p>
      ) : (
        <div
          className="h-[180px] w-full min-w-0 sm:h-[200px]"
          role="img"
          aria-label={`${t('analytics.weeklyActive.title')}. ${t('analytics.weeklyActive.subtitle')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -4, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                tickFormatter={(week: number) => {
                  if (!X_TICK_WEEKS.has(week)) return ''
                  return t(`analytics.weeklyActive.xTicks.w${week}`)
                }}
              />
              <YAxis
                domain={[0, Y_MAX]}
                ticks={[...Y_TICKS]}
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                tickFormatter={formatYTick}
              />
              <Tooltip
                cursor={{
                  fill: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                }}
                content={<WeeklyTooltip numberLocale={numberLocale} />}
              />
              <Bar
                dataKey="value"
                name={t('analytics.weeklyActive.seriesName')}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.week}
                    fill={entry.isLast ? BAR_EMPHASIS : BAR_MUTED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalyticsSectionCard>
  )
}
