import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type {
  RewardRow,
  RewardStock,
  RewardThumbnailTone,
} from '@/features/rewards/types/rewards.types'

const GRID =
  'grid min-w-[640px] grid-cols-[minmax(0,1.6fr)_minmax(5rem,0.7fr)_minmax(5.5rem,0.75fr)_minmax(4.5rem,0.6fr)_minmax(3.5rem,0.45fr)] items-center'

const thumbnailToneClassNames: Record<RewardThumbnailTone, string> = {
  violet: 'bg-primary/20',
  sky: 'bg-info/25',
  mint: 'bg-success/20',
  amber: 'bg-warning/25',
  rose: 'bg-destructive/15',
  slate: 'bg-muted',
}

type RewardsCatalogTableProps = {
  rows: readonly RewardRow[]
  isLoading?: boolean
  liveOverrides: Readonly<Record<string, boolean>>
  onLiveChange: (id: string, live: boolean) => void
}

function formatStock(
  stock: RewardStock,
  t: (key: string, options?: Record<string, string | number>) => string,
): { label: string; isDepleted: boolean } {
  if (stock.kind === 'unlimited') {
    return { label: t('rewards.catalog.stockUnlimited'), isDepleted: false }
  }
  return {
    label: t('rewards.catalog.stockLimited', {
      left: stock.left,
      total: stock.total,
    }),
    isDepleted: stock.left === 0,
  }
}

export function RewardsCatalogTable({
  rows,
  isLoading = false,
  liveOverrides,
  onLiveChange,
}: RewardsCatalogTableProps) {
  const { t } = useTranslation()

  return (
    <div className="min-w-0">
      {isLoading ? (
        <div className="px-0 py-2">
          <TableSkeleton
            rows={6}
            columns={5}
            dense
            label={t('rewards.states.loading')}
          />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {t('rewards.states.emptyCatalog')}
        </p>
      ) : (
        <div
          className="overflow-x-auto"
          role="table"
          aria-label={t('rewards.tabs.catalog')}
        >
          <div
            role="row"
            className={cn(GRID, 'border-b border-border bg-muted/40')}
          >
            {(
              ['reward', 'cost', 'left', 'redeemed', 'live'] as const
            ).map((col) => (
              <div
                key={col}
                role="columnheader"
                className="px-4 py-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase"
              >
                {t(`rewards.columns.${col}`)}
              </div>
            ))}
          </div>

          {rows.map((row) => {
            const live = liveOverrides[row.id] ?? row.live
            const stock = formatStock(row.stock, t)

            return (
              <div
                key={row.id}
                role="row"
                className={cn(GRID, 'border-b border-border last:border-b-0')}
              >
                <div role="cell" className="flex min-w-0 items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      'size-11 shrink-0 rounded-lg',
                      thumbnailToneClassNames[row.thumbnailTone],
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {t(`rewards.items.${row.titleKey}`)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(`rewards.items.${row.subtitleKey}`)}
                    </p>
                  </div>
                </div>

                <div
                  role="cell"
                  className="px-4 py-3 text-sm font-bold tabular-nums text-foreground"
                >
                  {t('rewards.catalog.costPoints', { count: row.costPoints })}
                </div>

                <div
                  role="cell"
                  className={cn(
                    'px-4 py-3 text-sm font-bold tabular-nums',
                    stock.isDepleted
                      ? 'text-destructive'
                      : 'text-foreground',
                  )}
                >
                  {stock.label}
                </div>

                <div
                  role="cell"
                  className="px-4 py-3 text-sm font-bold tabular-nums text-foreground"
                >
                  {row.redeemed}
                </div>

                <div role="cell" className="px-4 py-3">
                  <Switch
                    checked={live}
                    onCheckedChange={(checked) => onLiveChange(row.id, checked)}
                    aria-label={t('rewards.catalog.toggleLive', {
                      name: t(`rewards.items.${row.titleKey}`),
                    })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
