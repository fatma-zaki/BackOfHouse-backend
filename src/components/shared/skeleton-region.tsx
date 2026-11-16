import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type SkeletonRegionProps = {
  children: ReactNode
  className?: string
  /** Screen-reader loading announcement. Defaults to `states.loading`. */
  label?: string
}

/**
 * Accessible wrapper for decorative skeleton layouts.
 * Announces loading once; children are hidden from assistive tech.
 */
export function SkeletonRegion({
  children,
  className,
  label,
}: SkeletonRegionProps) {
  const { t } = useTranslation()
  const announcement = label ?? t('states.loading')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(className)}
    >
      <span className="sr-only">{announcement}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}
