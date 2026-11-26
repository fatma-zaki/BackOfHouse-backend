import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSession } from '@/app/providers/session'
import { ErrorState } from '@/components/shared/error-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyWorkKpiGrid } from '@/features/my-work/components/my-work-kpi-grid'
import { MyWorkSectionCard } from '@/features/my-work/components/my-work-section-card'
import { useMyQueue } from '@/features/my-work/hooks/use-my-work'
import {
  MY_WORK_QUEUE_PATH,
  type MyWorkQueueEntry,
} from '@/features/my-work/types/my-work.types'

type QueueTab = 'all' | 'listings' | 'verification' | 'reports'

function filterQueue(rows: MyWorkQueueEntry[], tab: QueueTab) {
  switch (tab) {
    case 'listings':
      return rows.filter((row) => row.to === 'listings')
    case 'verification':
      return rows.filter(
        (row) => row.to === 'verification' || row.to === 'claims',
      )
    case 'reports':
      return rows.filter((row) => row.to === 'moderation')
    default:
      return rows
  }
}

export function MyQueueDashboard() {
  const { t } = useTranslation()
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useMyQueue()
  const [tab, setTab] = useState<QueueTab>('all')

  const rows = useMemo(
    () => filterQueue(data?.upNext ?? [], tab),
    [data?.upNext, tab],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('myWork.queue.title', {
          name: t(`team.admins.names.${user.nameKey}`),
        })}
        description={t('myWork.queue.description')}
        actions={
          <Button asChild className="h-9 rounded-full px-4">
            <Link to="/admin/listings">{t('myWork.queue.actions.startReviewing')}</Link>
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
            namespace="myWork.queue.kpis"
            isLoading={isPending}
          />

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <MyWorkSectionCard
              title={t('myWork.queue.upNext.title')}
              description={t('myWork.queue.upNext.description')}
              action={
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as QueueTab)}
                >
                  <TabsList variant="line" className="h-8">
                    <TabsTrigger value="all">
                      {t('myWork.queue.tabs.all')}
                    </TabsTrigger>
                    <TabsTrigger value="listings">
                      {t('myWork.queue.tabs.listings')}
                    </TabsTrigger>
                    <TabsTrigger value="verification">
                      {t('myWork.queue.tabs.verification')}
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                      {t('myWork.queue.tabs.reports')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              }
              flush
            >
              {isPending ? (
                <div className="px-2 pb-4">
                  <TableSkeleton
                    rows={5}
                    columns={4}
                    dense
                    label={t('states.loading')}
                  />
                </div>
              ) : (
              <Table aria-label={t('myWork.queue.upNext.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('myWork.queue.columns.item')}</TableHead>
                    <TableHead>{t('myWork.queue.columns.queue')}</TableHead>
                    <TableHead>{t('myWork.queue.columns.deadline')}</TableHead>
                    <TableHead className="w-[88px] text-end">
                      <span className="sr-only">
                        {t('myWork.queue.columns.open')}
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {t('myWork.queue.upNext.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {t(`myWork.queue.items.${row.titleKey}`)}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t(`myWork.queue.items.${row.metaKey}`)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.queueTone}>
                            {t(`myWork.queue.queues.${row.queueKey}`)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.slaTone}>
                            {t(`myWork.queue.sla.${row.slaKey}`)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            asChild
                            variant="link"
                            className="h-auto px-0 text-[13px] font-bold"
                          >
                            <Link to={MY_WORK_QUEUE_PATH[row.to]}>
                              {t('myWork.queue.actions.review')}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </MyWorkSectionCard>

            <div className="flex flex-col gap-4">
              <MyWorkSectionCard title={t('myWork.queue.guidelines.title')}>
                {isPending ? (
                  <ListSkeleton rows={4} showAvatar={false} showMeta={false} />
                ) : (
                <ol className="flex flex-col gap-3">
                  {(data?.guidelines ?? []).map((step, index) => (
                    <li key={step.id} className="flex gap-3 text-[13px]">
                      <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-foreground">
                          {t(`myWork.queue.guidelines.${step.titleKey}`)}
                        </span>
                        <span className="text-muted-foreground">
                          {t(`myWork.queue.guidelines.${step.bodyKey}`)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                )}
              </MyWorkSectionCard>

              <MyWorkSectionCard title={t('myWork.queue.decisions.title')}>
                {isPending ? (
                  <ListSkeleton rows={4} showAvatar={false} />
                ) : (
                <ul className="flex flex-col">
                  {(data?.recentDecisions ?? []).map((decision, index, all) => (
                    <li
                      key={decision.id}
                      className={
                        index < all.length - 1
                          ? 'border-b border-border py-3'
                          : 'py-3'
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {t(`myWork.queue.decisions.items.${decision.titleKey}`)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t(`myWork.queue.decisions.items.${decision.metaKey}`)}
                          </p>
                        </div>
                        <StatusBadge status={decision.outcomeTone}>
                          {t(
                            `myWork.queue.decisions.outcomes.${decision.outcomeKey}`,
                          )}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
                )}
              </MyWorkSectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
