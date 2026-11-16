import { useTranslation } from 'react-i18next'
import { CardSkeleton } from '@/components/shared/card-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import { KpiGridSkeleton } from '@/components/shared/kpi-grid-skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserDetailNotFoundError } from '@/features/users/api/get-user-detail'
import { UserDetailAdminActions } from '@/features/users/components/user-detail-admin-actions'
import { UserDetailHeader } from '@/features/users/components/user-detail-header'
import { UserDetailKpiGrid } from '@/features/users/components/user-detail-kpi-grid'
import { UserDetailMainPanel } from '@/features/users/components/user-detail-main-panel'
import { UserDetailNotes } from '@/features/users/components/user-detail-notes'
import { UserDetailProfileCard } from '@/features/users/components/user-detail-profile-card'
import { useUserDetail } from '@/features/users/hooks/use-user-detail'

type UserDetailViewProps = {
  userId: string
}

function UserDetailLoadingSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <CardSkeleton lines={6} announce={false} />
          <CardSkeleton lines={2} showHeader={false} announce={false} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <KpiGridSkeleton
            count={4}
            gridClassName="grid grid-cols-2 gap-2 lg:grid-cols-4"
            announce={false}
          />
          <Card className="min-w-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <FormSkeleton fields={4} showActions={false} announce={false} />
            </CardContent>
          </Card>
          <CardSkeleton lines={3} announce={false} />
        </div>
      </div>
    </SkeletonRegion>
  )
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = useUserDetail({
    userId,
    enabled: Boolean(userId),
  })

  if (!userId) {
    return (
      <ErrorState
        title={t('users.states.missingIdTitle')}
        description={t('users.states.missingIdDescription')}
      />
    )
  }

  if (isPending) {
    return (
      <UserDetailLoadingSkeleton label={t('users.states.loadingDetail')} />
    )
  }

  const notFound =
    error instanceof UserDetailNotFoundError ||
    (isError && error?.name === 'UserDetailNotFoundError')

  if (notFound) {
    return (
      <ErrorState
        title={t('users.states.notFoundTitle')}
        description={t('users.states.notFoundDescription')}
      />
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={t('users.states.errorTitle')}
        description={t('users.states.errorDescription')}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  const userName = t(`users.people.${data.profile.nameKey}`)

  return (
    <div className="flex flex-col gap-4">
      <UserDetailHeader profile={data.profile} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <UserDetailProfileCard profile={data.profile} />
          <UserDetailAdminActions userName={userName} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <UserDetailKpiGrid kpis={data.kpis} />
          <UserDetailMainPanel pointsEntries={data.pointsEntries} />
          <UserDetailNotes key={userId} initialNotes={data.internalNotes} />
        </div>
      </div>
    </div>
  )
}
