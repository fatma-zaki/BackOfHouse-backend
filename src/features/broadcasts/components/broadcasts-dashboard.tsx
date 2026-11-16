import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { BroadcastsHeader } from '@/features/broadcasts/components/broadcasts-header'
import { BroadcastsNewBroadcastCard } from '@/features/broadcasts/components/broadcasts-new-broadcast-card'
import { BroadcastsSentScheduledCard } from '@/features/broadcasts/components/broadcasts-sent-scheduled-card'
import { useBroadcastsDashboard } from '@/features/broadcasts/hooks/use-broadcasts-dashboard'
import type {
  AudienceRule,
  BroadcastChannelId,
  BroadcastMessageContent,
  BroadcastRow,
} from '@/features/broadcasts/types/broadcasts.types'

const EMPTY_CHANNELS: Record<BroadcastChannelId, boolean> = {
  push: false,
  email: false,
  inApp: false,
}

const EMPTY_DRAFT: BroadcastMessageContent = {
  en: { title: '', body: '' },
  ar: { title: '', body: '' },
}

const EMPTY_RULES: readonly AudienceRule[] = []
const EMPTY_ROWS: readonly BroadcastRow[] = []

export function BroadcastsDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useBroadcastsDashboard()

  return (
    <div className="flex flex-col gap-4">
      <BroadcastsHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('broadcasts.states.errorTitle')}
          description={t('broadcasts.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <BroadcastsNewBroadcastCard
            isLoading={isPending}
            audienceRules={data?.audienceRules ?? EMPTY_RULES}
            audienceMatchCount={data?.audienceMatchCount ?? 0}
            defaultChannels={data?.defaultChannels ?? EMPTY_CHANNELS}
            draftMessage={data?.draftMessage ?? EMPTY_DRAFT}
          />
          <BroadcastsSentScheduledCard
            rows={data?.rows ?? EMPTY_ROWS}
            isLoading={isPending}
          />
        </div>
      )}
    </div>
  )
}
