import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/shared/stat-card'
import type { MyWorkKpi } from '@/features/my-work/types/my-work.types'

type MyWorkKpiGridProps = {
  kpis: readonly MyWorkKpi[] | undefined
  /** i18n prefix, e.g. `myWork.queue.kpis` */
  namespace: string
  isLoading?: boolean
}

export function MyWorkKpiGrid({
  kpis,
  namespace,
  isLoading = false,
}: MyWorkKpiGridProps) {
  const { t } = useTranslation()
  const rows: readonly MyWorkKpi[] =
    kpis ??
    Array.from({ length: 4 }, (_, index) => ({
      id: `skeleton-${index}`,
      labelKey: '',
      valueKey: '',
    }))

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {rows.map((kpi) => (
        <StatCard
          key={kpi.id}
          title={isLoading ? '…' : t(`${namespace}.${kpi.labelKey}`)}
          value={isLoading ? '—' : t(`${namespace}.values.${kpi.valueKey}`)}
          description={
            !isLoading && kpi.secondaryKey
              ? t(`${namespace}.secondary.${kpi.secondaryKey}`)
              : undefined
          }
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
