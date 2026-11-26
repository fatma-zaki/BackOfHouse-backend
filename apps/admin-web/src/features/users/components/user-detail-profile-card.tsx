import { BadgeCheck, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { UsersTypeBadge } from '@/features/users/components/users-type-badge'
import { cn } from '@/lib/utils'
import type {
  UserAvatarTone,
  UserDetailProfile,
} from '@/features/users/types/users.types'

const avatarToneClassNames: Record<UserAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

const DETAIL_LAST_ACTIVE_KEYS = new Set(['reemLastActive'])

function resolveLastActiveLabel(
  lastActiveKey: string,
  t: (key: string) => string,
): string {
  if (DETAIL_LAST_ACTIVE_KEYS.has(lastActiveKey)) {
    return t(`users.detail.${lastActiveKey}`)
  }
  return t(`users.lastActive.${lastActiveKey}`)
}

type UserDetailProfileCardProps = {
  profile: UserDetailProfile
}

export function UserDetailProfileCard({ profile }: UserDetailProfileCardProps) {
  const { t } = useTranslation()

  const detailRows = [
    { labelKey: 'email', value: t(`users.emails.${profile.emailKey}`) },
    { labelKey: 'phone', value: t(`users.phones.${profile.phoneKey}`) },
    ...(profile.universityKey
      ? [
          {
            labelKey: 'university',
            value: t(`users.universities.${profile.universityKey}`),
          },
        ]
      : []),
    ...(profile.verifiedMetaKey
      ? [
          {
            labelKey: 'verifiedOn',
            value: t(`users.detail.${profile.verifiedMetaKey}`),
          },
        ]
      : []),
    {
      labelKey: 'lastActive',
      value: resolveLastActiveLabel(profile.lastActiveKey, t),
    },
  ] as const

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'inline-flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold',
              avatarToneClassNames[profile.avatarTone],
            )}
            aria-hidden="true"
          >
            {profile.initials}
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-foreground">
              {t(`users.people.${profile.nameKey}`)}
              {profile.verified ? (
                <BadgeCheck
                  className="size-4 text-primary"
                  aria-label={t('users.verification.verified')}
                />
              ) : null}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.typeIds.map((typeId) => (
                <UsersTypeBadge key={typeId} typeId={typeId}>
                  {t(`users.types.${typeId}`)}
                </UsersTypeBadge>
              ))}
            </div>
          </div>
        </div>

        <dl className="space-y-2.5 text-sm">
          {detailRows.map((row) => (
            <div key={row.labelKey} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="font-bold text-muted-foreground">
                {t(`users.detail.fields.${row.labelKey}`)}
              </dt>
              <dd className="min-w-0 font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>{t('users.detail.privacyNote', { name: t(`users.people.${profile.nameKey}`) })}</p>
        </div>
      </CardContent>
    </Card>
  )
}
