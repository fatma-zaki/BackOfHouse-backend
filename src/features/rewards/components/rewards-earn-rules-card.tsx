import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { EarnRuleRow } from '@/features/rewards/types/rewards.types'

type RewardsEarnRulesCardProps = {
  rules: readonly EarnRuleRow[]
  isLoading?: boolean
}

export function RewardsEarnRulesCard({
  rules,
  isLoading = false,
}: RewardsEarnRulesCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-bold">
          {t('rewards.earnRules.title')}
        </CardTitle>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs font-bold text-primary"
          onClick={() => {
            toast.message(t('rewards.toasts.editRules'))
          }}
        >
          {t('rewards.earnRules.editRules')}
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-0 pt-0">
        {isLoading ? (
          <ListSkeleton
            rows={5}
            showAvatar={false}
            label={t('rewards.states.loading')}
          />
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-foreground">
                  {t(`rewards.earnRules.items.${rule.labelKey}`)}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-sm font-bold tabular-nums',
                    rule.points > 0
                      ? 'text-success'
                      : 'text-muted-foreground',
                  )}
                >
                  {rule.points > 0
                    ? t('rewards.earnRules.pointsPositive', {
                        count: rule.points,
                      })
                    : t('rewards.earnRules.pointsZero')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
