import { Download, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export function EventsHeader() {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('events.title')}
      description={t('events.description')}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('events.actions.exportDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('events.actions.export')}
          </Button>

          <Button
            type="button"
            className="h-9 rounded-full px-4 font-medium shadow-none"
            onClick={() => {
              toast.message(t('events.toasts.newEvent'))
            }}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            {t('events.actions.newEvent')}
          </Button>
        </div>
      }
    />
  )
}
