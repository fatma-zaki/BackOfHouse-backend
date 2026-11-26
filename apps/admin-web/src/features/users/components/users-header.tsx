import { Download, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export function UsersHeader() {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('users.title')}
      description={t('users.description')}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('users.actions.exportDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('users.actions.export')}
          </Button>

          <Button
            type="button"
            disabled
            aria-disabled="true"
            title={t('users.actions.importDisabledHint')}
            className="h-9 rounded-full px-4 font-medium shadow-none disabled:pointer-events-none disabled:opacity-100"
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            {t('users.actions.importUsers')}
          </Button>
        </div>
      }
    />
  )
}
