import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdjustmentMemberOption,
  RewardsDashboardData,
} from '@/features/rewards/types/rewards.types'

type RewardsManualAdjustmentCardProps = {
  members: readonly AdjustmentMemberOption[]
  defaults: RewardsDashboardData['manualAdjustmentDefaults']
  isLoading?: boolean
}

function memberLabel(
  member: AdjustmentMemberOption,
  t: (key: string, options?: Record<string, string | number>) => string,
  locale: string,
): string {
  return t('rewards.manualAdjustment.memberOption', {
    name: t(`rewards.members.${member.memberKey}`),
    points: member.pointsBalance.toLocaleString(locale),
  })
}

export function RewardsManualAdjustmentCard({
  members,
  defaults,
  isLoading = false,
}: RewardsManualAdjustmentCardProps) {
  const { t, i18n } = useTranslation()

  const [memberId, setMemberId] = useState(
    () => defaults.memberId || members[0]?.id || '',
  )
  const [pointsDelta, setPointsDelta] = useState(defaults.pointsDelta)
  const [reason, setReason] = useState(() =>
    t(`rewards.manualAdjustment.reasons.${defaults.reasonKey}`),
  )

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">
          {t('rewards.manualAdjustment.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rewards-adjust-member" className="text-xs font-bold">
            {t('rewards.manualAdjustment.memberLabel')}
          </Label>
          <Select
            value={memberId}
            onValueChange={setMemberId}
            disabled={isLoading}
          >
            <SelectTrigger
              id="rewards-adjust-member"
              className="h-10 w-full rounded-xl bg-card text-sm font-medium shadow-none"
            >
              <SelectValue placeholder={t('rewards.manualAdjustment.memberLabel')} />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {memberLabel(member, t, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rewards-adjust-points" className="text-xs font-bold">
            {t('rewards.manualAdjustment.pointsLabel')}
          </Label>
          <Input
            id="rewards-adjust-points"
            value={pointsDelta}
            onChange={(event) => setPointsDelta(event.target.value)}
            disabled={isLoading}
            className="h-10 rounded-xl text-sm font-bold shadow-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rewards-adjust-reason" className="text-xs font-bold">
            {t('rewards.manualAdjustment.reasonLabel')}
          </Label>
          <Textarea
            id="rewards-adjust-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isLoading}
            rows={3}
            className="min-h-[5.5rem] resize-none rounded-xl text-sm shadow-none"
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('rewards.manualAdjustment.helper')}
        </p>
      </CardContent>

      <CardFooter className="justify-end border-t border-border pt-4">
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-full px-5 font-bold"
          disabled={isLoading}
          onClick={() => {
            toast.success(t('rewards.toasts.adjustmentApplied'))
          }}
        >
          {t('rewards.manualAdjustment.apply')}
        </Button>
      </CardFooter>
    </Card>
  )
}
