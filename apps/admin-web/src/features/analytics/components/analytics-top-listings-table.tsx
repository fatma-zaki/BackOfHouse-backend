import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AnalyticsSectionCard } from '@/features/analytics/components/analytics-section-card'
import type { AnalyticsTopListing } from '@/features/analytics/types/analytics.types'
import { cn } from '@/lib/utils'

type AnalyticsTopListingsTableProps = {
  listings: readonly AnalyticsTopListing[] | undefined
  isLoading?: boolean
  className?: string
}

/** Reference RateCell scale: 10% conversion fills the track. */
function conversionBarPercent(conversion: number): number {
  return Math.min(100, conversion * 10)
}

export function AnalyticsTopListingsTable({
  listings,
  isLoading = false,
  className,
}: AnalyticsTopListingsTableProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'

  return (
    <AnalyticsSectionCard
      title={t('analytics.topListings.title')}
      action={
        <Link
          to="/admin/listings"
          className="text-xs font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('analytics.topListings.allListings')}
        </Link>
      }
      flush
      className={cn(className)}
    >
      {isLoading ? (
        <div className="px-2 pb-6">
          <TableSkeleton
            rows={4}
            columns={4}
            dense
            label={t('analytics.states.loading')}
          />
        </div>
      ) : !listings || listings.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          {t('analytics.states.emptyTable')}
        </p>
      ) : (
        <Table aria-label={t('analytics.topListings.title')}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 text-xs font-bold text-muted-foreground">
                {t('analytics.topListings.columns.listing')}
              </TableHead>
              <TableHead className="h-9 text-end text-xs font-bold text-muted-foreground">
                {t('analytics.topListings.columns.views')}
              </TableHead>
              <TableHead className="h-9 text-end text-xs font-bold text-muted-foreground">
                {t('analytics.topListings.columns.applications')}
              </TableHead>
              <TableHead className="h-9 text-xs font-bold text-muted-foreground">
                {t('analytics.topListings.columns.conversion')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => {
              const title = t(`analytics.topListings.items.${listing.id}.title`)
              const company = t(
                `analytics.topListings.items.${listing.id}.company`,
              )
              const conversionLabel = t('analytics.topListings.conversionLabel', {
                value: new Intl.NumberFormat(numberLocale, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }).format(listing.conversion),
              })

              return (
                <TableRow key={listing.id}>
                  <TableCell className="py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {company}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-end text-sm font-bold tabular-nums">
                    {listing.views}
                  </TableCell>
                  <TableCell className="py-3 text-end text-sm font-bold tabular-nums">
                    {listing.applications}
                  </TableCell>
                  <TableCell className="min-w-[7.5rem] py-3">
                    <div className="flex w-full items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded bg-primary/10">
                        <div
                          className="h-full min-w-1 rounded bg-primary"
                          style={{
                            width: `${conversionBarPercent(listing.conversion)}%`,
                          }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-end text-xs font-bold tabular-nums text-foreground">
                        {conversionLabel}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </AnalyticsSectionCard>
  )
}
