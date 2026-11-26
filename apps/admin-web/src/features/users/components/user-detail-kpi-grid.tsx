import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import type { UserDetailKpi } from '@/features/users/types/users.types'

type UserDetailKpiGridProps = {
  kpis: readonly UserDetailKpi[]
}

export function UserDetailKpiGrid({ kpis }: UserDetailKpiGridProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="shadow-sm">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-bold text-muted-foreground">
              {t(`users.detail.kpis.${kpi.id}`)}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {kpi.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
