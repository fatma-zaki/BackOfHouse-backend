import { cn } from '@/lib/utils'
import type { EventThumbGradient } from '@/features/events/types/events.types'

const gradientClassNames: Record<EventThumbGradient, string> = {
  violet: 'bg-linear-to-br from-violet-500/80 to-indigo-600/90',
  sky: 'bg-linear-to-br from-sky-400/80 to-blue-600/90',
  amber: 'bg-linear-to-br from-amber-400/80 to-orange-600/90',
  emerald: 'bg-linear-to-br from-emerald-400/80 to-teal-600/90',
  rose: 'bg-linear-to-br from-rose-400/80 to-pink-600/90',
  slate: 'bg-linear-to-br from-slate-400/70 to-slate-600/90',
}

type EventsEventThumbProps = {
  gradient: EventThumbGradient
  className?: string
  decorative?: boolean
}

export function EventsEventThumb({
  gradient,
  className,
  decorative = true,
}: EventsEventThumbProps) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-lg',
        gradientClassNames[gradient],
        className,
      )}
      aria-hidden={decorative}
    />
  )
}
