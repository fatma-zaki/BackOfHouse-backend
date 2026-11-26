import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ErrorStateProps = {
  title: string
  description?: string
  /** Called when the default retry button is pressed. */
  onRetry?: () => void
  /** Label for the default retry button. */
  retryLabel?: string
  /** Custom action node. Takes precedence over the default retry button. */
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  action,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const resolvedAction =
    action ??
    (onRetry ? (
      <Button type="button" variant="outline" onClick={onRetry}>
        {retryLabel ?? t('actions.retry')}
      </Button>
    ) : null)

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-10 text-center',
        className,
      )}
    >
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-heading text-base leading-snug font-bold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {resolvedAction ? <div className="mt-1">{resolvedAction}</div> : null}
    </div>
  )
}
