import type { ReactNode } from 'react'
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from '@/components/shared/breadcrumbs'
import { cn } from '@/lib/utils'

export type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  const showMetaRow = Boolean(description) || Boolean(actions)

  return (
    <header className={cn('flex flex-col gap-3', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : null}

      <div className="space-y-1">
        <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-foreground">
          {title}
        </h1>

        {showMetaRow ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {description ? (
              <p className="min-w-0 max-w-2xl flex-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : (
              <span className="min-w-0 flex-1" aria-hidden="true" />
            )}

            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
