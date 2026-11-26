import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ErrorState } from '@/components/shared/error-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
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
import { MyWorkKpiGrid } from '@/features/my-work/components/my-work-kpi-grid'
import { MyWorkMeterList } from '@/features/my-work/components/my-work-meter-list'
import { MyWorkSectionCard } from '@/features/my-work/components/my-work-section-card'
import { useMyDesk } from '@/features/my-work/hooks/use-my-work'
import { cn } from '@/lib/utils'

export function MyDeskDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useMyDesk()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('myWork.desk.title')}
        description={t('myWork.desk.description')}
        actions={
          <Button asChild className="h-9 rounded-full px-4">
            <Link to="/admin/news">{t('myWork.desk.actions.newStory')}</Link>
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
            namespace="myWork.desk.kpis"
            isLoading={isPending}
          />

          <MyWorkSectionCard
            title={t('myWork.desk.week.title')}
            action={
              <span className="text-xs text-muted-foreground">
                {t('myWork.desk.week.note')}
              </span>
            }
          >
            {isPending ? (
              <SkeletonRegion label={t('states.loading')}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {Array.from({ length: 7 }, (_, index) => (
                    <Skeleton
                      key={index}
                      className="min-h-[108px] w-full rounded-lg"
                    />
                  ))}
                </div>
              </SkeletonRegion>
            ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {(data?.week ?? []).map((day) => (
                <div
                  key={day.id}
                  className={cn(
                    'flex min-h-[108px] flex-col gap-2 rounded-lg border border-border p-2.5',
                    day.today && 'border-primary/40 bg-primary/5',
                  )}
                >
                  <span className="text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
                    {t(`myWork.desk.week.days.${day.dayKey}`)}
                  </span>
                  {day.items.map((item) => (
                    <Link
                      key={item.labelKey}
                      to={item.href}
                      className={cn(
                        'rounded-md px-2 py-1.5 text-[12px] font-medium leading-snug',
                        item.tone === 'warning'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-info/10 text-info',
                      )}
                    >
                      {t(`myWork.desk.week.items.${item.labelKey}`)}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            )}
          </MyWorkSectionCard>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <MyWorkSectionCard
              title={t('myWork.desk.drafts.title')}
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
              <Table aria-label={t('myWork.desk.drafts.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('myWork.desk.columns.story')}</TableHead>
                    <TableHead>{t('myWork.desk.columns.languages')}</TableHead>
                    <TableHead>{t('myWork.desk.columns.edited')}</TableHead>
                    <TableHead className="w-[72px] text-end">
                      <span className="sr-only">
                        {t('myWork.desk.columns.open')}
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {(data?.drafts ?? []).map((draft) => (
                      <TableRow key={draft.id}>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {t(`myWork.desk.drafts.items.${draft.titleKey}`)}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t(
                                `myWork.desk.drafts.categories.${draft.categoryKey}`,
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] text-foreground">
                              {t(
                                `myWork.desk.drafts.languages.${draft.languagesKey}`,
                              )}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t(
                                `myWork.desk.drafts.readiness.${draft.readinessKey}`,
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t(`myWork.desk.drafts.edited.${draft.editedKey}`)}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            asChild
                            variant="link"
                            className="h-auto px-0 text-[13px] font-bold"
                          >
                            <Link to={draft.href}>
                              {t('myWork.desk.actions.open')}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </MyWorkSectionCard>

            <MyWorkSectionCard
              title={t('myWork.desk.mostRead.title')}
              description={t('myWork.desk.mostRead.description')}
            >
              {isPending ? (
                <ListSkeleton rows={5} showAvatar={false} showMeta={false} />
              ) : (
                <MyWorkMeterList
                  items={data?.mostRead ?? []}
                  labelNamespace="myWork.desk.mostRead.items"
                />
              )}
            </MyWorkSectionCard>
          </div>
        </>
      )}
    </div>
  )
}
