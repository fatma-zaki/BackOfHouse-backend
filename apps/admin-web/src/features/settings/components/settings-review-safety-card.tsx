import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SettingsToggleRow } from '@/features/settings/components/settings-toggle-row'
import type { ToggleSettingRow } from '@/features/settings/types/settings.types'

type SettingsReviewSafetyCardProps = {
  id?: string
  rows: readonly ToggleSettingRow[]
  isLoading?: boolean
  onToggle: (id: string, enabled: boolean) => void
}

export function SettingsReviewSafetyCard({
  id,
  rows,
  isLoading = false,
  onToggle,
}: SettingsReviewSafetyCardProps) {
  const { t } = useTranslation()

  return (
    <Card id={id} className="min-w-0 flex-1 gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="px-4 py-4">
        <CardTitle className="text-base font-bold">
          {t('settings.reviewSafety.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <ListSkeleton
            rows={5}
            showAvatar={false}
            className="pb-4"
            label={t('settings.states.loading')}
          />
        ) : (
          <>
            <div className="flex justify-between border-y border-border bg-muted/40 px-4 py-2.5 text-[11px] font-bold text-muted-foreground">
              <span>{t('settings.reviewSafety.columns.setting')}</span>
              <span>{t('settings.reviewSafety.columns.on')}</span>
            </div>
            {rows.map((row) => (
              <SettingsToggleRow
                key={row.id}
                variant="plain"
                title={t(`settings.reviewSafety.items.${row.id}.title`)}
                description={t(
                  `settings.reviewSafety.items.${row.id}.description`,
                )}
                checked={row.enabled}
                onCheckedChange={(checked) => onToggle(row.id, checked)}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
