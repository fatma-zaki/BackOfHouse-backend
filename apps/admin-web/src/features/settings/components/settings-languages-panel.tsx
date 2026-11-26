import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsPanel } from '@/features/settings/components/settings-panel'
import { SettingsToggleRow } from '@/features/settings/components/settings-toggle-row'
import type { SettingsLanguages } from '@/features/settings/types/settings.types'

type SettingsLanguagesPanelProps = {
  value: SettingsLanguages
  onChange: (value: SettingsLanguages) => void
}

export function SettingsLanguagesPanel({
  value,
  onChange,
}: SettingsLanguagesPanelProps) {
  const { t } = useTranslation()

  return (
    <SettingsPanel
      title={t('settings.languages.title')}
      subtitle={t('settings.languages.description')}
      flush
    >
      <SettingsToggleRow
        title={t('settings.languages.english.title')}
        description={t('settings.languages.english.description')}
        checked
        disabled
        onCheckedChange={() => undefined}
      />
      <SettingsToggleRow
        title={t('settings.languages.arabic.title')}
        description={t('settings.languages.arabic.description')}
        checked={value.arabic}
        onCheckedChange={(arabic) => onChange({ ...value, arabic })}
      />
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <Label htmlFor="settings-default-language">
          {t('settings.languages.defaultLanguage')}
        </Label>
        <Select
          value={value.defaultLanguage}
          onValueChange={(next) => {
            if (next === 'english' || next === 'arabic') {
              onChange({ ...value, defaultLanguage: next })
            }
          }}
        >
          <SelectTrigger id="settings-default-language" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">
              {t('settings.languages.options.english')}
            </SelectItem>
            <SelectItem value="arabic">
              {t('settings.languages.options.arabic')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsPanel>
  )
}
