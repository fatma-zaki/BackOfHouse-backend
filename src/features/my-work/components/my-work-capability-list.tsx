import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MyWorkCapability } from '@/features/my-work/types/my-work.types'
import { cn } from '@/lib/utils'

type MyWorkCapabilityListProps = {
  items: readonly MyWorkCapability[]
  /** i18n prefix, e.g. `myWork.tickets.capabilities` */
  namespace: string
}

export function MyWorkCapabilityList({
  items,
  namespace,
}: MyWorkCapabilityListProps) {
  const { t } = useTranslation()

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5 text-[13px]">
          <span
            className={cn(
              'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full',
              item.allowed
                ? 'bg-success/15 text-success'
                : 'bg-muted text-muted-foreground',
            )}
            aria-hidden="true"
          >
            {item.allowed ? (
              <Check className="size-3 stroke-[2.5]" />
            ) : (
              <X className="size-3 stroke-[2.5]" />
            )}
          </span>
          <span
            className={cn(
              'leading-snug',
              item.allowed ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {t(`${namespace}.${item.textKey}`)}
          </span>
        </li>
      ))}
    </ul>
  )
}
