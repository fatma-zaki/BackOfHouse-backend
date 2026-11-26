import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { PointsRuleRow } from '@/features/settings/types/settings.types'

type SettingsPointsRulesCardProps = {
  id?: string
  rows: readonly PointsRuleRow[]
  isLoading?: boolean
  onPointsChange: (id: string, points: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function SettingsPointsRulesCard({
  id,
  rows,
  isLoading = false,
  onPointsChange,
  onToggle,
}: SettingsPointsRulesCardProps) {
  const { t } = useTranslation()

  return (
    <Card id={id} className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="gap-1 px-4 py-4">
        <CardTitle className="text-base font-bold">
          {t('settings.pointsRules.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.pointsRules.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="px-0 py-2 pb-4">
            <TableSkeleton
              rows={6}
              columns={4}
              dense
              label={t('settings.states.loading')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-muted-foreground">
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-start text-[11px] font-bold"
                  >
                    {t('settings.pointsRules.columns.activity')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-end text-[11px] font-bold"
                  >
                    {t('settings.pointsRules.columns.points')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-start text-[11px] font-bold"
                  >
                    {t('settings.pointsRules.columns.limit')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-end text-[11px] font-bold"
                  >
                    {t('settings.pointsRules.columns.on')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const activity = t(
                    `settings.pointsRules.activities.${row.activityKey}`,
                  )
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {activity}
                      </td>
                      <td className="px-4 py-3.5 text-end">
                        {row.locked ? (
                          <span className="font-bold tabular-nums text-muted-foreground">
                            {row.points}
                          </span>
                        ) : (
                          <Input
                            value={row.points}
                            inputMode="numeric"
                            aria-label={t('settings.pointsRules.pointsFor', {
                              activity,
                            })}
                            className="ms-auto h-[30px] w-16 bg-background px-2 text-end text-[13px] font-bold tabular-nums"
                            onChange={(event) =>
                              onPointsChange(
                                row.id,
                                event.target.value.replace(/\D/g, ''),
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {row.locked ? (
                          <StatusBadge status="neutral">
                            {t('settings.pointsRules.limits.locked')}
                          </StatusBadge>
                        ) : (
                          <span className="text-muted-foreground">
                            {t(`settings.pointsRules.limits.${row.limitKey}`)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-end">
                        <Switch
                          checked={row.enabled}
                          disabled={row.locked}
                          aria-label={t(
                            'settings.pointsRules.toggleActivity',
                            { activity },
                          )}
                          onCheckedChange={(checked) =>
                            onToggle(row.id, checked)
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
