import { format, parseISO } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { OverviewSignupsSeries } from '@/features/overview/types/overview.types'
import { cn } from '@/lib/utils'

const BAR_MUTED = 'color-mix(in srgb, var(--chart-1) 42%, transparent)'
const BAR_EMPHASIS = 'var(--chart-1)'

function buildYAxis(maxValue: number): { domainMax: number; ticks: number[] } {
  const safeMax = Math.max(0, maxValue)
  const padded = safeMax === 0 ? 10 : Math.ceil(safeMax * 1.15)
  const step = Math.max(1, Math.ceil(padded / 4))
  const domainMax = step * 4
  return {
    domainMax,
    ticks: [0, step, step * 2, step * 3, domainMax],
  }
}

type OverviewSignupsChartProps = {
  signups: OverviewSignupsSeries | undefined
  isLoading?: boolean
  className?: string
}

type ChartRow = {
  date: string
  count: number
  label: string
  isLast: boolean
}

type TooltipPayloadItem = {
  payload?: ChartRow
}

function shouldShowXTick(date: string, index: number, total: number): boolean {
  if (total <= 1) return true
  if (index === 0 || index === total - 1) return true
  const day = parseISO(date).getDate()
  return day === 1 || day === 8 || day === 15 || day === 22 || day === 28
}

function SignupTooltip({
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
        {t('overview.signups.tooltipCount', {
          count: new Intl.NumberFormat(numberLocale).format(row.count),
        })}
      </p>
    </div>
  )
}

export function OverviewSignupsChart({
  signups,
  isLoading = false,
  className,
}: OverviewSignupsChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dateLocale = isArabic ? dateFnsAr : dateFnsEnUS
  const numberLocale = isArabic ? 'ar' : 'en'

  const chartData = useMemo<ChartRow[]>(() => {
    const points = signups?.points ?? []
    return points.map((point, index) => ({
      date: point.date,
      count: point.count,
      label: format(parseISO(point.date), 'MMM d, yyyy', { locale: dateLocale }),
      isLast: index === points.length - 1,
    }))
  }, [signups?.points, dateLocale])

  const summary = useMemo(() => {
    if (!signups || signups.points.length === 0) return null
    const total = new Intl.NumberFormat(numberLocale).format(
      signups.totalInRange,
    )
    if (!signups.peak) {
      return t('overview.signups.summaryTotalOnly', { total })
    }
    const peakCount = new Intl.NumberFormat(numberLocale).format(
      signups.peak.count,
    )
    const peakDate = format(parseISO(signups.peak.date), 'MMM d', {
      locale: dateLocale,
    })
    return t('overview.signups.summary', {
      total,
      peak: peakCount,
      date: peakDate,
    })
  }, [signups, numberLocale, dateLocale, t])

  const yAxis = useMemo(() => {
    const peak = signups?.peak?.count ?? 0
    const seriesMax = Math.max(
      peak,
      ...(signups?.points.map((point) => point.count) ?? [0]),
    )
    return buildYAxis(seriesMax)
  }, [signups])

  const chartDescription = summary ?? t('overview.signups.emptyDescription')

  return (
    <Card className={cn('min-w-0 overflow-visible shadow-sm', className)}>
      <CardHeader className="gap-1">
        <CardTitle className="min-w-0 pe-2 text-base leading-snug font-bold text-foreground">
          {t('overview.signups.title')}
        </CardTitle>

        <CardAction className="max-w-none justify-self-end">
          <Link
            to="/admin/analytics"
            className="inline-block whitespace-nowrap text-sm leading-5 font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('overview.signups.openAnalytics')}
          </Link>
        </CardAction>

        {!isLoading && summary ? (
          <CardDescription className="min-w-0 text-xs leading-normal">
            {summary}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ChartSkeleton label={t('overview.states.loading')} />
        ) : chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('overview.signups.empty')}
          </p>
        ) : (
          <div
            className="h-56 w-full min-w-0 sm:h-64"
            role="img"
            aria-label={`${t('overview.signups.title')}. ${chartDescription}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  minTickGap={8}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(value: string, index: number) => {
                    if (!shouldShowXTick(value, index, chartData.length)) {
                      return ''
                    }
                    return format(parseISO(value), 'MMM d', {
                      locale: dateLocale,
                    })
                  }}
                />
                <YAxis
                  domain={[0, yAxis.domainMax]}
                  ticks={yAxis.ticks}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
                  content={<SignupTooltip numberLocale={numberLocale} />}
                />
                <Bar
                  dataKey="count"
                  name={t('overview.signups.seriesName')}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={entry.isLast ? BAR_EMPHASIS : BAR_MUTED}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
