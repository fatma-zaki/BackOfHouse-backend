import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { UsersTypeBadge } from '@/features/users/components/users-type-badge'
import { cn } from '@/lib/utils'
import type {
  UserAvatarTone,
  UserRow,
} from '@/features/users/types/users.types'

const GRID =
  'grid min-w-[960px] grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(5.5rem,0.75fr)_minmax(4.5rem,0.6fr)_minmax(4rem,0.55fr)_minmax(5.5rem,0.7fr)_minmax(5rem,0.65fr)_minmax(5rem,0.65fr)_minmax(3rem,0.45fr)] items-center'

const avatarToneClassNames: Record<UserAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type UsersTableProps = {
  rows: readonly UserRow[]
  isLoading?: boolean
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  selectedIds: ReadonlySet<string>
  onToggleRow: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean, visibleIds: readonly string[]) => void
  selectionBar?: React.ReactNode
}

export function UsersTable({
  rows,
  isLoading = false,
  page,
  pageSize,
  totalItems,
  onPageChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
  selectionBar,
}: UsersTableProps) {
  const { t } = useTranslation()

  const visibleIds = rows.map((row) => row.id)
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allSelected

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      {selectionBar ? (
        <div className="border-b border-border px-4 py-2">{selectionBar}</div>
      ) : null}

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={8}
              columns={9}
              dense
              label={t('users.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('users.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('users.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-b border-border bg-muted/40')}
            >
              <div role="columnheader" className="px-2 py-2.5 ps-4">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) =>
                    onToggleAll(checked === true, visibleIds)
                  }
                  aria-label={t('users.table.selectAll')}
                />
              </div>
              {(
                [
                  'user',
                  'type',
                  'city',
                  'points',
                  'verification',
                  'joined',
                  'lastActive',
                  'actions',
                ] as const
              ).map((col) => (
                <div
                  key={col}
                  role="columnheader"
                  className={cn(
                    'px-3 py-2.5 text-[11px] font-bold text-muted-foreground last:pe-4',
                    col === 'actions' && 'sr-only',
                  )}
                >
                  {t(`users.columns.${col}`)}
                </div>
              ))}
            </div>

            <div role="rowgroup">
              {rows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  className={cn(
                    GRID,
                    'min-h-[64px] border-b border-border last:border-b-0',
                    selectedIds.has(row.id) && 'bg-primary/[0.04]',
                  )}
                >
                  <div role="cell" className="px-2 py-2.5 ps-4">
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={(checked) =>
                        onToggleRow(row.id, checked === true)
                      }
                      aria-label={t('users.table.selectRow', {
                        name: t(`users.people.${row.nameKey}`),
                      })}
                    />
                  </div>

                  <div role="cell" className="min-w-0 px-3 py-2.5">
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
                        <p className="flex min-w-0 items-center gap-1 truncate text-[13px] font-bold text-foreground">
                          <span className="truncate">
                            {t(`users.people.${row.nameKey}`)}
                          </span>
                          {row.verified ? (
                            <BadgeCheck
                              className="size-3.5 shrink-0 text-primary"
                              aria-label={t('users.verification.verified')}
                            />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`users.emails.${row.emailKey}`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <UsersTypeBadge typeId={row.typeId}>
                      {t(`users.types.${row.typeId}`)}
                    </UsersTypeBadge>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-foreground"
                  >
                    {t(`users.cities.${row.cityId}`)}
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] font-bold tabular-nums text-foreground"
                  >
                    {row.points === null
                      ? t('users.table.pointsDash')
                      : row.points.toLocaleString()}
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                        row.verified
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {row.verified
                        ? t('users.verification.verified')
                        : t('users.verification.notVerified')}
                    </span>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-muted-foreground"
                  >
                    {t(`users.joined.${row.joinedKey}`)}
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-muted-foreground"
                  >
                    {t(`users.lastActive.${row.lastActiveKey}`)}
                  </div>

                  <div role="cell" className="px-3 py-2.5 pe-4 text-end">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-[13px] font-bold text-primary"
                      asChild
                    >
                      <Link to={`/admin/users/${row.id}`}>
                        {t('users.actions.view')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {!isLoading && totalItems > 0 ? (
        <CardFooter className="border-t bg-card px-4 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            className="w-full"
          />
        </CardFooter>
      ) : null}
    </Card>
  )
}
