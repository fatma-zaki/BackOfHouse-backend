import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { EventsDetail } from '@/features/events/components/events-detail'
import { EventsHeader } from '@/features/events/components/events-header'
import { EventsKpiGrid } from '@/features/events/components/events-kpi-grid'
import { EventsTable } from '@/features/events/components/events-table'
import { useEventsDashboard } from '@/features/events/hooks/use-events-dashboard'
import {
  countByTab,
  filterEvents,
  uniqueOptionValues,
} from '@/features/events/lib/filter-events'
import type { EventsTabId } from '@/features/events/types/events.types'

export function EventsDashboard() {
  const { t } = useTranslation()

  const [tab, setTab] = useState<EventsTabId>('past')
  const [cityId, setCityId] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useEventsDashboard()

  const rows = data?.events ?? []

  const tabCounts = useMemo(() => countByTab(rows), [rows])

  const visibleRows = useMemo(
    () =>
      filterEvents(rows, {
        tab,
        cityId,
      }),
    [rows, tab, cityId],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0] ?? null

  const effectiveSelectedId = selected?.id ?? null

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('events.filters.allCities') },
      ...values.map((value) => ({
        value,
        label: t(`events.cities.${value}`),
      })),
    ]
  }, [rows, t])

  return (
    <div className="flex flex-col gap-4">
      <EventsHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('events.states.errorTitle')}
          description={t('events.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <EventsKpiGrid kpis={data?.kpis ?? []} isLoading={isPending} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)]">
            <EventsTable
              rows={visibleRows}
              selectedId={effectiveSelectedId}
              isLoading={isPending}
              onSelect={(id) => setSelectedId(id)}
              tab={tab}
              onTabChange={(next) => {
                setTab(next)
                setSelectedId(null)
              }}
              tabCounts={tabCounts}
              cityId={cityId}
              onCityChange={setCityId}
              cityOptions={cityOptions}
            />
            <EventsDetail event={selected} isLoading={isPending} />
          </div>
        </>
      )}
    </div>
  )
}
