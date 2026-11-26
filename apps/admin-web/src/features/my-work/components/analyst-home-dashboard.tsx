import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSession } from '@/app/providers/session'
import { ChartSkeleton } from '@/components/shared/chart-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MyWorkCapabilityList } from '@/features/my-work/components/my-work-capability-list'
import { MyWorkKpiGrid } from '@/features/my-work/components/my-work-kpi-grid'
import { MyWorkSectionCard } from '@/features/my-work/components/my-work-section-card'
import { useAnalystHome } from '@/features/my-work/hooks/use-my-work'

export function AnalystHomeDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAnalystHome()
  const maxBar = Math.max(
    ...(data?.applicationsPerWeek.map((point) => point.value) ?? [1]),
    1,
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('myWork.analyst.title', {
          name: t(`team.admins.names.${user.nameKey}`),
        })}
        description={t('myWork.analyst.description')}
        actions={
          <Button asChild className="h-9 rounded-full px-4">
            <Link to="/admin/reports">{t('myWork.analyst.actions.newReport')}</Link>
          </Button>
        }
      />

      {!isPending && isError ? (
        <ErrorState
          title={t('myWork.states.errorTitle')}
          description={t('myWork.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <MyWorkKpiGrid
            kpis={data?.kpis}
            namespace="myWork.analyst.kpis"
            isLoading={isPending}
          />

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <MyWorkSectionCard
              title={t('myWork.analyst.reports.title')}
              action={
                <Button
                  asChild
                  variant="link"
                  className="h-auto px-0 text-[13px] font-bold"
                >
                  <Link to="/admin/reports">
                    {t('myWork.analyst.reports.all')}
                  </Link>
                </Button>
              }
              flush
            >
              {isPending ? (
                <div className="px-2 pb-4">
                  <TableSkeleton
                    rows={4}
                    columns={4}
                    dense
                    label={t('states.loading')}
                  />
                </div>
              ) : (
              <Table aria-label={t('myWork.analyst.reports.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('myWork.analyst.columns.report')}</TableHead>
                    <TableHead>{t('myWork.analyst.columns.schedule')}</TableHead>
                    <TableHead>{t('myWork.analyst.columns.lastRun')}</TableHead>
                    <TableHead>{t('myWork.analyst.columns.formats')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {(data?.savedReports ?? []).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {t(
                                `myWork.analyst.reports.items.${report.titleKey}`,
                              )}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t(
                                `myWork.analyst.reports.items.${report.descriptionKey}`,
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t(
                            `myWork.analyst.reports.schedules.${report.scheduleKey}`,
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t(
                            `myWork.analyst.reports.lastRuns.${report.lastRunKey}`,
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] text-foreground">
                            {report.formats.join(' · ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </MyWorkSectionCard>

            <div className="flex flex-col gap-4">
              <MyWorkSectionCard
                title={t('myWork.analyst.chart.title')}
                description={t('myWork.analyst.chart.description')}
              >
                {isPending ? (
                  <ChartSkeleton
                    heightClassName="h-[120px]"
                    label={t('states.loading')}
                  />
                ) : (
                  <>
                    <div
                      className="flex h-[120px] items-end gap-1.5"
                      role="img"
                      aria-label={t('myWork.analyst.chart.description')}
                    >
                      {(data?.applicationsPerWeek ?? []).map((point) => (
                        <div
                          key={point.id}
                          className="flex min-w-0 flex-1 flex-col justify-end"
                          title={new Intl.NumberFormat(i18n.language).format(
                            point.value,
                          )}
                        >
                          <div
                            className="w-full rounded-t-sm bg-primary/80"
                            style={{
                              height: `${Math.max(
                                8,
                                Math.round((point.value / maxBar) * 100),
                              )}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('myWork.analyst.chart.axis')}
                    </p>
                  </>
                )}
              </MyWorkSectionCard>

              <MyWorkSectionCard title={t('myWork.analyst.access.title')}>
                {isPending ? (
                  <ListSkeleton rows={4} showAvatar={false} showMeta={false} />
                ) : (
                  <MyWorkCapabilityList
                    items={data?.dataAccess ?? []}
                    namespace="myWork.analyst.access.items"
                  />
                )}
              </MyWorkSectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
