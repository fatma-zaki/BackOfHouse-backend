import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import { MyWorkCapabilityList } from '@/features/my-work/components/my-work-capability-list'
import { MyWorkKpiGrid } from '@/features/my-work/components/my-work-kpi-grid'
import { MyWorkMeterList } from '@/features/my-work/components/my-work-meter-list'
import { MyWorkSectionCard } from '@/features/my-work/components/my-work-section-card'
import { useMyTickets } from '@/features/my-work/hooks/use-my-work'
import type { MyWorkTicket } from '@/features/my-work/types/my-work.types'

type TicketTab = 'mine' | 'shared' | 'waiting'

function filterTickets(rows: MyWorkTicket[], tab: TicketTab) {
  switch (tab) {
    case 'mine':
      return rows.filter(
        (row) => row.queue === 'mine' && row.slaTone !== 'neutral',
      )
    case 'shared':
      return rows.filter((row) => row.queue === 'shared')
    case 'waiting':
      return rows.filter((row) => row.slaTone === 'neutral')
    default:
      return rows
  }
}

export function MyTicketsDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useMyTickets()
  const [tab, setTab] = useState<TicketTab>('mine')

  const rows = useMemo(
    () => filterTickets(data?.tickets ?? [], tab),
    [data?.tickets, tab],
  )

  const nextTicketPath = '/admin/support'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('myWork.tickets.title')}
        description={t('myWork.tickets.description')}
        actions={
          <Button asChild className="h-9 rounded-full px-4">
            <Link to={nextTicketPath}>
              {t('myWork.tickets.actions.openNext')}
            </Link>
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
            namespace="myWork.tickets.kpis"
            isLoading={isPending}
          />

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <MyWorkSectionCard
              title={t('myWork.tickets.list.title')}
              action={
                <span className="text-xs text-muted-foreground">
                  {t('myWork.tickets.list.sorted')}
                </span>
              }
              flush
            >
              <div className="border-b border-border px-4 pb-2">
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as TicketTab)}
                >
                  <TabsList variant="line" className="h-8">
                    <TabsTrigger value="mine">
                      {t('myWork.tickets.tabs.mine')}
                    </TabsTrigger>
                    <TabsTrigger value="shared">
                      {t('myWork.tickets.tabs.shared')}
                    </TabsTrigger>
                    <TabsTrigger value="waiting">
                      {t('myWork.tickets.tabs.waiting')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
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
              <Table aria-label={t('myWork.tickets.list.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('myWork.tickets.columns.from')}</TableHead>
                    <TableHead>{t('myWork.tickets.columns.topic')}</TableHead>
                    <TableHead>{t('myWork.tickets.columns.deadline')}</TableHead>
                    <TableHead className="w-[72px] text-end">
                      <span className="sr-only">
                        {t('myWork.tickets.columns.open')}
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {t('myWork.tickets.list.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {t(`myWork.tickets.items.${row.subjectKey}`)}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {t(`myWork.tickets.from.${row.fromKey}`)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.topicTone}>
                            {t(`myWork.tickets.topics.${row.topicKey}`)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.slaTone}>
                            {t(`myWork.tickets.sla.${row.slaKey}`)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            asChild
                            variant="link"
                            className="h-auto px-0 text-[13px] font-bold"
                          >
                            <Link to="/admin/support">
                              {t('myWork.tickets.actions.open')}
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
              <MyWorkSectionCard title={t('myWork.tickets.capabilities.title')}>
                {isPending ? (
                  <ListSkeleton rows={4} showAvatar={false} showMeta={false} />
                ) : (
                  <MyWorkCapabilityList
                    items={data?.capabilities ?? []}
                    namespace="myWork.tickets.capabilities.items"
                  />
                )}
              </MyWorkSectionCard>

              <MyWorkSectionCard
                title={t('myWork.tickets.byTopic.title')}
                description={t('myWork.tickets.byTopic.description')}
              >
                {isPending ? (
                  <ListSkeleton rows={4} showAvatar={false} showMeta={false} />
                ) : (
                  <MyWorkMeterList
                    items={data?.byTopic ?? []}
                    labelNamespace="myWork.tickets.byTopic.items"
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
