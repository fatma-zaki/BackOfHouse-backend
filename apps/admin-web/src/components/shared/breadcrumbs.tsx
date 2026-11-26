import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  label: string
  /** When set, the item is rendered as a React Router link (except the last item). */
  path?: string
}

export type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
  /** Accessible name for the navigation landmark. */
  label?: string
}

export function Breadcrumbs({ items, className, label }: BreadcrumbsProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={label ?? t('breadcrumbs.navLabel')}
      className={cn('min-w-0', className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const key = `${item.label}-${index}`

          return (
            <li key={key} className="inline-flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
                />
              ) : null}

              {isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-bold text-foreground"
                >
                  {item.label}
                </span>
              ) : item.path ? (
                <Link
                  to={item.path}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate text-muted-foreground">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
