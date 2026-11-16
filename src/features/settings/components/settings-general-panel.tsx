import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsPanel } from '@/features/settings/components/settings-panel'
import type { SettingsGeneral } from '@/features/settings/types/settings.types'

type SettingsGeneralPanelProps = {
  value: SettingsGeneral
  onChange: (value: SettingsGeneral) => void
}

export function SettingsGeneralPanel({
  value,
  onChange,
}: SettingsGeneralPanelProps) {
  const { t } = useTranslation()

  return (
    <SettingsPanel
      title={t('settings.general.title')}
      subtitle={t('settings.general.description')}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-platform-name">
            {t('settings.general.fields.platformName')}
          </Label>
          <Input
            id="settings-platform-name"
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-support-email">
            {t('settings.general.fields.supportEmail')}
          </Label>
          <Input
            id="settings-support-email"
            type="email"
            value={value.email}
            onChange={(event) =>
              onChange({ ...value, email: event.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-timezone">
            {t('settings.general.fields.timezone')}
          </Label>
          <Select
            value={value.timezone}
            onValueChange={(timezone) => onChange({ ...value, timezone })}
          >
            <SelectTrigger id="settings-timezone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="riyadh">
                {t('settings.general.timezones.riyadh')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingsPanel>
  )
}
