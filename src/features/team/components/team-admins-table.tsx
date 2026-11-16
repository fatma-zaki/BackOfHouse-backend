import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TeamRoleBadge } from '@/features/team/components/team-role-badge'
import { cn } from '@/lib/utils'
import type {
  TeamAdminRow,
  TeamAvatarTone,
} from '@/features/team/types/team.types'

const GRID =
  'grid w-full grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_auto] items-center'

const avatarToneClassNames: Record<TeamAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type TeamAdminsTableProps = {
  rows: readonly TeamAdminRow[]
  isLoading?: boolean
}

export function TeamAdminsTable({
  rows,
  isLoading = false,
}: TeamAdminsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="px-[18px] py-3.5">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          {t('team.admins.title', { count: rows.length })}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={7}
              columns={4}
              dense
              label={t('team.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('team.states.emptyAdmins')}
          </p>
        ) : (
          <div
            className="overflow-x-hidden"
            role="table"
            aria-label={t('team.admins.tableLabel')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-y border-border bg-muted/30')}
            >
              {(['admin', 'role', 'lastActive', 'actions'] as const).map(
                (col) => (
                  <div
                    key={col}
                    role="columnheader"
                    className={cn(
                      'px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-[18px] last:pe-[18px]',
                      col === 'actions' && 'sr-only',
                    )}
                  >
                    {t(`team.admins.columns.${col}`)}
                  </div>
                ),
              )}
            </div>

            <div role="rowgroup">
              {rows.map((row) => {
                const pendingInvite = row.lastActiveKey === 'none'

                return (
                  <div
                    key={row.id}
                    role="row"
                    className={cn(
                      GRID,
                      'h-14 border-b border-border last:border-b-0',
                    )}
                  >
                    <div role="cell" className="min-w-0 px-3 py-2 ps-[18px]">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                            avatarToneClassNames[row.avatarTone],
                          )}
                          aria-hidden="true"
                        >
                          {row.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-foreground">
                            {t(`team.admins.names.${row.nameKey}`)}
                          </p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            dir={pendingInvite ? undefined : 'ltr'}
                          >
                            {pendingInvite && row.inviteSentDateKey
                              ? t('team.admins.inviteSent', {
                                  date: t(
                                    `team.admins.dates.${row.inviteSentDateKey}`,
                                  ),
                                })
                              : t(`team.admins.emails.${row.emailKey}`)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div role="cell" className="min-w-0 px-2 py-2">
                      <TeamRoleBadge roleId={row.roleId}>
                        {t(`team.roles.${row.roleId}`)}
                      </TeamRoleBadge>
                    </div>

                    <div
                      role="cell"
                      className="min-w-0 truncate px-2 py-2 text-[13px] text-muted-foreground"
                    >
                      {pendingInvite
                        ? t('team.admins.lastActive.none')
                        : t(`team.admins.lastActive.${row.lastActiveKey}`)}
                    </div>

                    <div role="cell" className="px-2 py-2 pe-[18px] text-end">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-[13px] font-bold whitespace-nowrap text-primary"
                        onClick={() => {
                          toast.message(
                            pendingInvite
                              ? t('team.toasts.previewInvite')
                              : t('team.toasts.editAdmin', {
                                  name: t(`team.admins.names.${row.nameKey}`),
                                }),
                          )
                        }}
                      >
                        {t('team.actions.edit')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
