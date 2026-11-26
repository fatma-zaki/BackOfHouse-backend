import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { ClaimsImportsImportStatusBadge } from '@/features/claims-imports/components/claims-imports-import-status-badge'
import { cn } from '@/lib/utils'
import type {
  ImportStatusId,
  RecentImportRow,
} from '@/features/claims-imports/types/claims-imports.types'

function ImportProgressBar({
  percent,
  statusId,
}: {
  percent: number
  statusId: ImportStatusId
}) {
  const clamped = Math.min(100, Math.max(0, percent))
  const processing = statusId === 'processing'

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full',
        processing ? 'bg-info/20' : 'bg-muted',
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

type ClaimsImportsRecentImportsCardProps = {
  rows: readonly RecentImportRow[]
  isLoading?: boolean
}

export function ClaimsImportsRecentImportsCard({
  rows,
  isLoading = false,
}: ClaimsImportsRecentImportsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">
          {t('claimsImports.recentImports.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <ListSkeleton
            rows={3}
            showAvatar={false}
            showMeta
            label={t('claimsImports.states.loadingImports')}
          />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('claimsImports.states.emptyImports')}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-bold text-foreground">
                  {t(`claimsImports.files.${row.fileNameKey}`)}
                </p>
                <ClaimsImportsImportStatusBadge statusId={row.statusId}>
                  {t(`claimsImports.importStatus.${row.statusId}`)}
                </ClaimsImportsImportStatusBadge>
              </div>
              <ImportProgressBar
                percent={row.progressPercent}
                statusId={row.statusId}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t(`claimsImports.importDetails.${row.detailKey}`)}
                </p>
                {row.showErrorReportLink ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-bold text-primary"
                    onClick={() =>
                      toast.message(t('claimsImports.toasts.errorReport'))
                    }
                  >
                    {t('claimsImports.recentImports.downloadErrorReport')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
