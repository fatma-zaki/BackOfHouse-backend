import { Download, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

type NewsHeaderProps = {
  onNewStory: () => void
}

export function NewsHeader({ onNewStory }: NewsHeaderProps) {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('news.title')}
      description={t('news.description')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('news.actions.exportDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('news.actions.export')}
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full px-4 font-bold shadow-none"
            onClick={onNewStory}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            {t('news.actions.newStory')}
          </Button>
        </div>
      }
    />
  )
}
