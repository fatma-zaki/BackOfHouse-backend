import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export function TeamHeader() {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('team.title')}
      description={t('team.description')}
      actions={
        <Button
          type="button"
          className="h-9 rounded-full px-4 font-bold shadow-sm"
          onClick={() => {
            toast.message(t('team.toasts.inviteTeammate'))
          }}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          {t('team.actions.inviteTeammate')}
        </Button>
      }
    />
  )
}
