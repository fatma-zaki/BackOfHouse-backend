import type { ReactNode } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AnalyticsSectionCardProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  /** Flush padding for embedded tables. */
  flush?: boolean
}

export function AnalyticsSectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  flush = false,
}: AnalyticsSectionCardProps) {
  return (
    <Card className={cn('min-w-0 overflow-visible shadow-sm', className)}>
      <CardHeader className="gap-1">
        <CardTitle className="min-w-0 pe-2 text-[15px] leading-snug font-bold text-foreground">
          {title}
        </CardTitle>
        {action ? (
          <CardAction className="max-w-none justify-self-end self-start">
            {action}
          </CardAction>
        ) : null}
        {description ? (
          <CardDescription className="min-w-0 text-xs leading-normal">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={cn(flush && 'px-0 pb-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
