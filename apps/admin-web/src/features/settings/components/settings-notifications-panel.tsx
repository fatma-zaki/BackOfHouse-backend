import { useTranslation } from 'react-i18next'
import { SettingsPanel } from '@/features/settings/components/settings-panel'
import { SettingsToggleRow } from '@/features/settings/components/settings-toggle-row'
import type { ToggleSettingRow } from '@/features/settings/types/settings.types'

type SettingsNotificationsPanelProps = {
  rows: readonly ToggleSettingRow[]
  onToggle: (id: string, enabled: boolean) => void
}

export function SettingsNotificationsPanel({
  rows,
  onToggle,
}: SettingsNotificationsPanelProps) {
  const { t } = useTranslation()

  return (
    <SettingsPanel
      title={t('settings.notifications.title')}
      subtitle={t('settings.notifications.description')}
      flush
    >
      {rows.map((row) => (
        <SettingsToggleRow
          key={row.id}
          title={t(`settings.notifications.items.${row.id}.title`)}
          description={t(
            `settings.notifications.items.${row.id}.description`,
          )}
          checked={row.enabled}
          onCheckedChange={(checked) => onToggle(row.id, checked)}
        />
      ))}
    </SettingsPanel>
  )
}
