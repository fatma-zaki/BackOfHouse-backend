import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  TeamPermissionLevel,
  TeamPermissionRow,
  TeamRoleId,
} from '@/features/team/types/team.types'
import { TEAM_ROLE_IDS } from '@/features/team/types/team.types'

function PermissionCell({ level }: { level: TeamPermissionLevel }) {
  const { t } = useTranslation()

  if (level === 'none') {
    return (
      <span
        className="mx-auto block size-[22px]"
        aria-label={t('team.permissions.access.none')}
      />
    )
  }

  return (
    <span
      className={cn(
        'mx-auto flex size-[22px] items-center justify-center rounded-full text-[11px] font-extrabold',
        level === 'allowed'
          ? 'bg-success/15 text-success'
          : 'bg-primary/10 text-primary',
      )}
      aria-label={
        level === 'allowed'
          ? t('team.permissions.access.allowed')
          : t('team.permissions.access.viewOnly')
      }
    >
      {level === 'allowed' ? '✓' : '•'}
    </span>
  )
}

type TeamPermissionsMatrixProps = {
  rows: readonly TeamPermissionRow[]
  isLoading?: boolean
}

export function TeamPermissionsMatrix({
  rows,
  isLoading = false,
}: TeamPermissionsMatrixProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="gap-0.5 px-[18px] py-3.5">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          {t('team.permissions.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('team.permissions.subtitle')}
        </p>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={8}
              columns={5}
              dense
              label={t('team.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {t('team.states.emptyPermissions')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[520px] border-collapse text-[12.5px]"
              aria-label={t('team.permissions.tableLabel')}
            >
              <thead>
                <tr className="border-y border-border bg-muted/30">
                  <th
                    scope="col"
                    className="px-3 py-2 ps-[18px] text-start text-[11px] font-bold whitespace-nowrap text-muted-foreground"
                  >
                    {t('team.permissions.columns.permission')}
                  </th>
                  {TEAM_ROLE_IDS.map((roleId) => (
                    <th
                      key={roleId}
                      scope="col"
                      className="px-3 py-2 text-center text-[11px] font-bold whitespace-nowrap text-muted-foreground"
                    >
                      {t(`team.roles.${roleId}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="px-3 py-2 ps-[18px] text-start text-[12.5px] font-bold text-foreground"
                    >
                      {t(`team.permissions.items.${row.permissionKey}`)}
                    </th>
                    {TEAM_ROLE_IDS.map((roleId: TeamRoleId) => (
                      <td key={roleId} className="px-3 py-2 text-center">
                        <PermissionCell level={row.access[roleId]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CardFooter className="mx-[18px] mb-3 gap-2 border-0 bg-transparent p-0 pt-3 text-[12px] text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{t('team.permissions.legend')}</span>
      </CardFooter>
    </Card>
  )
}
