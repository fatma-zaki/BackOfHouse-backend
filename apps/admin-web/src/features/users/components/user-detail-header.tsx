import { ChevronLeft, Download, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { UserDetailProfile } from '@/features/users/types/users.types'

type UserDetailHeaderProps = {
  profile: UserDetailProfile
}

export function UserDetailHeader({ profile }: UserDetailHeaderProps) {
  const { t } = useTranslation()

  const subtitleParts = [
    ...profile.subtitleTypeKeys.map((key) => t(`users.types.${key}`)),
    t(`users.cities.${profile.cityId}`),
    t('users.detail.memberSince', {
      date: t(`users.joined.${profile.memberSinceKey}`),
    }),
  ]

  return (
    <div className="flex flex-col gap-3">
      <Link
        to="/admin/users"
        className="inline-flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('users.detail.backToUsers')}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {t(`users.people.${profile.nameKey}`)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {subtitleParts.join(' · ')}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('users.actions.exportUserDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('users.actions.exportUserData')}
          </Button>

          <Button
            type="button"
            className="h-9 rounded-full px-4 font-medium shadow-none"
            onClick={() => toast.message(t('users.toasts.sendMessage'))}
          >
            <Send data-icon="inline-start" aria-hidden="true" />
            {t('users.actions.sendMessage')}
          </Button>
        </div>
      </div>
    </div>
  )
}
