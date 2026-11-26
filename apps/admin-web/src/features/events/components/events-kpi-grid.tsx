import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { EventsKpiCard } from '@/features/events/components/events-kpi-card'
import type {
  EventsKpiFootnote,
  EventsKpiId,
  EventsKpiMetric,
} from '@/features/events/types/events.types'

const KPI_LABEL_KEYS: Record<EventsKpiId, string> = {
  upcomingEvents: 'events.kpis.upcomingEvents',
  registrationsSep: 'events.kpis.registrationsSep',
  attendanceVerified: 'events.kpis.attendanceVerified',
  pointsAwardedSep: 'events.kpis.pointsAwardedSep',
}

type EventsKpiGridProps = {
  kpis: readonly EventsKpiMetric[]
  isLoading?: boolean
}

function footnoteToneToBadgeStatus(
  tone: EventsKpiFootnote['tone'],
): StatusBadgeStatus {
  switch (tone) {
    case 'up':
      return 'success'
    case 'down':
      return 'destructive'
    case 'neutral':
    default:
      return 'neutral'
  }
}

function formatFootnoteLabel(
  footnote: EventsKpiFootnote,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  const sign = footnote.value >= 0 ? '+' : ''
  return t('events.kpis.footnotes.percentVsMonth', {
    sign,
    value: Math.abs(footnote.value),
    month: t(`events.kpis.months.${footnote.monthKey}`),
  })
}

export function EventsKpiGrid({
  kpis,
  isLoading = false,
}: EventsKpiGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <section
        aria-label={t('events.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <EventsKpiCard
            key={`skeleton-${index}`}
            title={t('events.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('events.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <EventsKpiCard
          key={kpi.id}
          title={t(KPI_LABEL_KEYS[kpi.id])}
          value={kpi.value}
          footnoteLabel={
            kpi.footnote ? formatFootnoteLabel(kpi.footnote, t) : undefined
          }
          footnoteStatus={
            kpi.footnote
              ? footnoteToneToBadgeStatus(kpi.footnote.tone)
              : undefined
          }
        />
      ))}
    </section>
  )
}
