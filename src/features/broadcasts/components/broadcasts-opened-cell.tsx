import { useTranslation } from 'react-i18next'

type BroadcastsOpenedCellProps = {
  openedPercent: number | null
}

export function BroadcastsOpenedCell({
  openedPercent,
}: BroadcastsOpenedCellProps) {
  const { t } = useTranslation()

  if (openedPercent === null) {
    return (
      <span className="text-[13px] font-bold text-foreground">
        {t('broadcasts.table.openedEmpty')}
      </span>
    )
  }

  const clamped = Math.min(100, Math.max(0, openedPercent))

  return (
    <div className="flex min-w-0 items-center justify-end gap-2.5">
      <div
        className="h-1.5 w-[4.5rem] shrink-0 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('broadcasts.table.openedAria', { percent: clamped })}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums text-foreground">
        {clamped}%
      </span>
    </div>
  )
}
