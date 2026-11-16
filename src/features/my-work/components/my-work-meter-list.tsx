import { useTranslation } from 'react-i18next'
import type { MyWorkMeter } from '@/features/my-work/types/my-work.types'

type MyWorkMeterListProps = {
  items: readonly MyWorkMeter[]
  /** i18n prefix for labels, e.g. `myWork.desk.mostRead` */
  labelNamespace: string
}

export function MyWorkMeterList({
  items,
  labelNamespace,
}: MyWorkMeterListProps) {
  const { t, i18n } = useTranslation()
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100)
        return (
          <li key={item.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate font-medium text-foreground">
                {t(`${labelNamespace}.${item.labelKey}`)}
              </span>
              <span className="num shrink-0 text-muted-foreground tabular-nums">
                {new Intl.NumberFormat(i18n.language).format(item.value)}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
