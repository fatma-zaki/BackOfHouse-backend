import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  SupportRelatedItem,
  SupportRequester,
} from '@/features/support/types/support.types'

type SupportUserSidebarProps = {
  requester: SupportRequester | null
  related: readonly SupportRelatedItem[]
  isLoading?: boolean
  onOpenProfile: () => void
  onAdjustPoints: () => void
}

export function SupportUserSidebar({
  requester,
  related,
  isLoading = false,
  onOpenProfile,
  onAdjustPoints,
}: SupportUserSidebarProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card className="flex min-h-[32rem] min-w-0 flex-col shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4">
          <SkeletonRegion
            label={t('support.states.loading')}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </SkeletonRegion>
          <ListSkeleton rows={3} showAvatar={false} showMeta />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
          <ListSkeleton rows={2} showAvatar={false} />
        </CardContent>
      </Card>
    )
  }

  if (!requester) {
    return (
      <Card className="min-h-[32rem] shadow-sm">
        <CardContent className="flex h-full items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground">
            {t('support.states.pickTicket')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex min-h-[32rem] min-w-0 flex-col shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar size="lg" className="size-14 bg-info/15">
            <AvatarFallback className="bg-info/15 text-base font-bold text-info">
              {requester.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading text-base font-bold text-foreground">
              {t(`support.senders.${requester.nameKey}`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`support.profileTypes.${requester.profileTypeKey}`)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border rounded-xl border border-border bg-muted/20 text-sm">
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted-foreground">{t('support.sidebar.points')}</dt>
            <dd className="font-bold text-foreground">{requester.points}</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted-foreground">
              {t('support.sidebar.eventsAttended')}
            </dt>
            <dd className="font-bold text-foreground">
              {requester.eventsAttended}
            </dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted-foreground">
              {t('support.sidebar.pastTickets')}
            </dt>
            <dd className="font-bold text-foreground">
              {requester.pastTickets}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-full"
            onClick={onOpenProfile}
          >
            {t('support.actions.openProfile')}
          </Button>
          <Button
            type="button"
            className="h-9 w-full rounded-full"
            onClick={onAdjustPoints}
          >
            {t('support.actions.adjustPoints')}
          </Button>
        </div>

        {related.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {t('support.sidebar.related')}
            </p>
            <ul className="space-y-2">
              {related.map((item) => (
                <li key={item.id}>
                  <div className="rounded-xl border border-border bg-card px-3 py-2.5">
                    <p className="text-[13px] font-bold text-foreground">
                      {t(`support.related.${item.titleKey}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`support.related.${item.detailKey}`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
