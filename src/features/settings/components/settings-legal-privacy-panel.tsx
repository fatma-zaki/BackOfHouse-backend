import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SettingsPanel } from '@/features/settings/components/settings-panel'
import type { LegalDocRow } from '@/features/settings/types/settings.types'

type SettingsLegalPrivacyPanelProps = {
  docs: readonly LegalDocRow[]
}

export function SettingsLegalPrivacyPanel({
  docs,
}: SettingsLegalPrivacyPanelProps) {
  const { t } = useTranslation()

  return (
    <SettingsPanel
      title={t('settings.legal.title')}
      subtitle={t('settings.legal.description')}
    >
      <ul>
        {docs.map((doc) => {
          const title = t(`settings.legal.docs.${doc.id}`)
          return (
            <li
              key={doc.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-border py-2.5 text-[13px] font-bold last:border-b-0"
            >
              <FileText
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 truncate">{title}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {t(`settings.legal.updated.${doc.updatedKey}`)}
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-xs font-bold text-primary"
                onClick={() =>
                  toast.message(t('settings.toasts.editDocument', { doc: title }))
                }
              >
                {t('settings.legal.edit')}
              </Button>
            </li>
          )
        })}
      </ul>
    </SettingsPanel>
  )
}
