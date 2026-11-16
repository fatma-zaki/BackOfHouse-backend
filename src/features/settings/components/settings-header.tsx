import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

type SettingsHeaderProps = {
  dirty: boolean
  onSave: () => void
}

export function SettingsHeader({ dirty, onSave }: SettingsHeaderProps) {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('settings.title')}
      description={
        dirty ? t('settings.descriptionDirty') : t('settings.description')
      }
      actions={
        <Button
          type="button"
          className="h-9 rounded-full px-4 font-bold shadow-none"
          disabled={!dirty}
          onClick={onSave}
        >
          <Save data-icon="inline-start" aria-hidden="true" />
          {t('settings.actions.saveChanges')}
        </Button>
      }
    />
  )
}
