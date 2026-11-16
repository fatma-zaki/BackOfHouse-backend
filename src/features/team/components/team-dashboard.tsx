import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { TeamAdminsTable } from '@/features/team/components/team-admins-table'
import { TeamHeader } from '@/features/team/components/team-header'
import { TeamPermissionsMatrix } from '@/features/team/components/team-permissions-matrix'
import { useTeamDashboard } from '@/features/team/hooks/use-team-dashboard'

export function TeamDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useTeamDashboard()

  return (
    <div className="flex flex-col gap-4">
      <TeamHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('team.states.errorTitle')}
          description={t('team.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <TeamAdminsTable
            rows={data?.admins ?? []}
            isLoading={isPending}
          />
          <TeamPermissionsMatrix
            rows={data?.permissions ?? []}
            isLoading={isPending}
          />
        </div>
      )}
    </div>
  )
}
