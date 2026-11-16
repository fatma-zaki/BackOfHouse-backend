import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export function SupportHeader() {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('support.title')}
      description={t('support.description')}
      actions={
        <Button
          type="button"
          variant="outline"
          disabled
          aria-disabled="true"
          title={t('support.actions.exportDisabledHint')}
          className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          {t('support.actions.exportTickets')}
        </Button>
      }
    />
  )
}
