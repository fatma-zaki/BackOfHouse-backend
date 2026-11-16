import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div
          className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}

      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-heading text-base leading-snug font-bold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
