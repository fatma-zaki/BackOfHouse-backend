import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReportsFileTile } from '@/features/reports/components/reports-file-tile'
import { downloadCsv } from '@/features/reports/lib/download-csv'
import { sampleRowsForReport } from '@/features/reports/lib/sample-rows'
import type { RecentExportItem } from '@/features/reports/types/reports.types'

type ReportsRecentProps = {
  items: readonly RecentExportItem[]
  schedules: readonly string[]
  isLoading?: boolean
  onUpdateSchedule: (id: string, scheduleId: string) => void
  onRemoveSchedule: (id: string) => void
}

export function ReportsRecent({
  items,
  schedules,
  isLoading = false,
  onUpdateSchedule,
  onRemoveSchedule,
}: ReportsRecentProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[15px] font-bold">
          {t('reports.recent.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <ListSkeleton rows={4} label={t('reports.states.loading')} />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('reports.states.emptyRecent')}
          </p>
        ) : (
        <ul className="flex flex-col">
          {items.map((item, index) => {
            const title = t(
              `reports.recent.titles.${item.titleKey}`,
              item.metaParams,
            )
            const meta = t(
              `reports.recent.meta.${item.metaKey}`,
              item.metaParams,
            )

            return (
              <li
                key={item.id}
                className={
                  index < items.length - 1
                    ? 'border-b border-border/70'
                    : undefined
                }
              >
                <div className="flex items-center gap-3 py-3">
                  <ReportsFileTile type={item.type} tone={item.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {meta}
                    </p>
                  </div>

                  {item.action === 'download' ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-bold text-primary hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      onClick={() => {
                        const reportId = item.sampleReportId ?? 'applications'
                        downloadCsv(
                          `${reportId}-sample`,
                          sampleRowsForReport(reportId),
                        )
                      }}
                    >
                      {t('reports.recent.actions.download')}
                    </button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-bold text-primary hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {t('reports.recent.actions.edit')}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {schedules.map((scheduleId) => (
                          <DropdownMenuItem
                            key={scheduleId}
                            onClick={() => {
                              onUpdateSchedule(item.id, scheduleId)
                              toast.success(t('reports.toasts.scheduleUpdated'))
                            }}
                          >
                            {t(`reports.schedules.${scheduleId}`)}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            onRemoveSchedule(item.id)
                            toast.message(t('reports.toasts.scheduleRemoved'))
                          }}
                        >
                          {t('reports.recent.actions.stop')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        )}
      </CardContent>
    </Card>
  )
}
