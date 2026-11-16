import { motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  BriefcaseBusiness,
  Flag,
  Inbox,
  LineChart,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { AdminGlassIconButton } from './admin-glass-icon-button'

type Notice = {
  id: string
  icon: LucideIcon
  textKey: string
  timeKey: string
  to: string
}

/**
 * Demo notification feed for the admin shell.
 * Static mock content — not live backend data and not permission-gated.
 */
const DEMO_NOTICES: Notice[] = [
  {
    id: 'n1',
    icon: BriefcaseBusiness,
    textKey: 'header.notices.listingReview',
    timeKey: 'header.notices.times.twelveMinutes',
    to: '/admin/listings',
  },
  {
    id: 'n2',
    icon: Flag,
    textKey: 'header.notices.listingReported',
    timeKey: 'header.notices.times.sixHours',
    to: '/admin/moderation',
  },
  {
    id: 'n3',
    icon: Inbox,
    textKey: 'header.notices.pointsMissing',
    timeKey: 'header.notices.times.threeHours',
    to: '/admin/support',
  },
  {
    id: 'n4',
    icon: ShieldCheck,
    textKey: 'header.notices.verificationRequests',
    timeKey: 'header.notices.times.oneDay',
    to: '/admin/verification',
  },
  {
    id: 'n5',
    icon: LineChart,
    textKey: 'header.notices.monthlyOverview',
    timeKey: 'header.notices.times.twoDays',
    to: '/admin/analytics',
  },
]

export function AdminNotifications() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set())
  const unread = DEMO_NOTICES.filter((notice) => !read.has(notice.id)).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <AdminGlassIconButton
          aria-label={t('header.notifications')}
          title={t('header.notifications')}
        >
          <motion.span
            className="inline-flex"
            animate={
              open || reduceMotion
                ? { rotate: 0 }
                : unread > 0
                  ? { rotate: [0, -12, 10, -6, 0] }
                  : undefined
            }
            transition={
              unread > 0 && !open && !reduceMotion
                ? { duration: 0.7, repeat: Infinity, repeatDelay: 2.4 }
                : { duration: 0.2 }
            }
          >
            <Bell className="size-[19px] stroke-[1.8]" aria-hidden="true" />
          </motion.span>
          {unread > 0 ? (
            <motion.span
              className="absolute top-1.5 end-1.5 size-2.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(255,255,255,0.65)]"
              aria-hidden="true"
              animate={
                reduceMotion
                  ? undefined
                  : { scale: [1, 1.28, 1], opacity: [1, 0.75, 1] }
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ) : null}
        </AdminGlassIconButton>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] gap-0 p-1.5">
        <div className="flex items-center justify-between px-2 py-1.5 text-[13px]">
          <b className="font-bold text-foreground">{t('header.notifications')}</b>
          {unread > 0 ? (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-xs font-bold text-accent-foreground"
              onClick={() =>
                setRead(new Set(DEMO_NOTICES.map((notice) => notice.id)))
              }
            >
              {t('header.markAllAsRead')}
            </button>
          ) : null}
        </div>

        {DEMO_NOTICES.length === 0 ? (
          <span className="block px-2 py-3 text-[13px] text-muted-foreground">
            {t('header.notificationsEmpty')}
          </span>
        ) : (
          DEMO_NOTICES.map((notice) => {
            const Icon = notice.icon
            const isUnread = !read.has(notice.id)

            return (
              <Link
                key={notice.id}
                to={notice.to}
                className={cn(
                  'flex items-start gap-2.5 rounded-md px-2 py-2 text-[12.5px] leading-[18px] text-muted-foreground hover:bg-muted',
                  isUnread && 'font-bold text-foreground',
                )}
                onClick={() => {
                  setRead((prev) => new Set(prev).add(notice.id))
                  setOpen(false)
                }}
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-[15px] stroke-[1.8]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">{t(notice.textKey)}</span>
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                  {t(notice.timeKey)}
                </span>
              </Link>
            )
          })
        )}
      </PopoverContent>
    </Popover>
  )
}
