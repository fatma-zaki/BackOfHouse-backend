import { useTranslation } from 'react-i18next'
import { ClaimsImportsClaimsTable } from '@/features/claims-imports/components/claims-imports-claims-table'
import { ClaimsImportsTabs } from '@/features/claims-imports/components/claims-imports-tabs'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  ClaimRow,
  ClaimsTabId,
} from '@/features/claims-imports/types/claims-imports.types'

const GUIDANCE_STEP_KEYS = ['checkEmail', 'askDocuments', 'handOver'] as const

type ClaimsImportsPageClaimsCardProps = {
  tab: ClaimsTabId
  onTabChange: (tab: ClaimsTabId) => void
  tabCounts: Record<ClaimsTabId, number>
  rows: readonly ClaimRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  onReview: (id: string) => void
}

export function ClaimsImportsPageClaimsCard({
  tab,
  onTabChange,
  tabCounts,
  rows,
  selectedId,
  onSelect,
  isLoading = false,
  onReview,
}: ClaimsImportsPageClaimsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="flex h-full min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="gap-3 border-b pb-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-bold">
            {t('claimsImports.pageClaims.title')}
          </CardTitle>
          <CardDescription>
            {t('claimsImports.pageClaims.description')}
          </CardDescription>
        </div>
        <CardAction className="row-span-1 row-start-1 sm:col-start-2">
          <ClaimsImportsTabs
            value={tab}
            onChange={onTabChange}
            counts={tabCounts}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 px-0 py-0">
        <ClaimsImportsClaimsTable
          rows={rows}
          selectedId={selectedId}
          onSelect={onSelect}
          isLoading={isLoading}
          onReview={onReview}
        />
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-5 border-t bg-muted/40 px-4 py-4 sm:flex-row sm:gap-8 sm:px-5">
        {GUIDANCE_STEP_KEYS.map((stepKey, index) => (
          <div key={stepKey} className="flex min-w-0 flex-1 gap-3">
            <span
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-bold leading-snug text-foreground">
                {t(`claimsImports.pageClaims.guidance.${stepKey}.title`)}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(`claimsImports.pageClaims.guidance.${stepKey}.description`)}
              </p>
            </div>
          </div>
        ))}
      </CardFooter>
    </Card>
  )
}
