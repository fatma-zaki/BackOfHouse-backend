import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  Link,
  useInRouterContext,
  useLocation,
} from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { setMobileSidebarOpen } from '@/store/slices/ui.slice'
import type { RootState } from '@/store/store'
import { useSession } from '@/app/providers/session'
import { AdminLogo } from './admin-logo'
import {
  navigationFor,
  type AdminNavItem,
} from './admin-navigation'

function PathnameProvider({
  children,
}: {
  children: (pathname: string) => ReactNode
}) {
  const inRouter = useInRouterContext()

  if (inRouter) {
    return <RoutedPathnameProvider>{children}</RoutedPathnameProvider>
  }

  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : ''

  return <>{children(pathname)}</>
}

function RoutedPathnameProvider({
  children,
}: {
  children: (pathname: string) => ReactNode
}) {
  const { pathname } = useLocation()
  return <>{children(pathname)}</>
}

function isItemActive(pathname: string, item: AdminNavItem): boolean {
  const { path, match } = item

  if (path === '/admin') {
    return pathname === '/admin' || pathname === '/admin/'
  }

  return (
    pathname === path ||
    pathname.startsWith(`${path}/`) ||
    !!match?.some((prefix) => pathname.startsWith(prefix))
  )
}

function navItemAriaLabel(label: string, badge?: number): string {
  if (badge == null) return label
  return `${label}, ${badge}`
}

function NavAnchor({
  item,
  label,
  className,
  active,
  onNavigate,
  children,
}: {
  item: AdminNavItem
  label: string
  className: string
  active: boolean
  onNavigate: () => void
  children: ReactNode
}) {
  const inRouter = useInRouterContext()
  const ariaLabel = navItemAriaLabel(label, item.badge)

  if (inRouter) {
    return (
      <Link
        to={item.path}
        className={className}
        aria-current={active ? 'page' : undefined}
        aria-label={ariaLabel}
        onClick={onNavigate}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      href={item.path}
      className={className}
      aria-current={active ? 'page' : undefined}
      aria-label={ariaLabel}
      onClick={onNavigate}
    >
      {children}
    </a>
  )
}

function NavBadge({ count }: { count: number }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant="default"
      className="ms-auto flex h-[18px] min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold tabular-nums"
      aria-hidden="true"
      title={t('shell.demoCount')}
    >
      {count}
    </Badge>
  )
}

function NavLinkItem({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem
  active: boolean
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const Icon = item.icon
  const label = t(item.labelKey)

  const className = cn(
    'flex h-[31px] w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    active
      ? 'bg-sidebar-accent font-bold text-sidebar-accent-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

  return (
    <NavAnchor
      item={item}
      label={label}
      className={className}
      active={active}
      onNavigate={onNavigate}
    >
      <Icon className="size-[17px] shrink-0 stroke-[1.75]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate whitespace-nowrap">{label}</span>
      {item.badge != null ? <NavBadge count={item.badge} /> : null}
    </NavAnchor>
  )
}

export function AdminSidebar() {
  const { t } = useTranslation()
  const { role } = useSession()
  const dispatch = useDispatch()
  const mobileSidebarOpen = useSelector(
    (state: RootState) => state.ui.mobileSidebarOpen,
  )
  const sections = navigationFor(role)

  const closeMobileSidebar = () => {
    dispatch(setMobileSidebarOpen(false))
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 transition-opacity lg:hidden',
          mobileSidebarOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        aria-label={t('shell.closeNavigation')}
        tabIndex={mobileSidebarOpen ? 0 : -1}
        onClick={closeMobileSidebar}
      />

      <aside
        className={cn(
          'sticky top-0 z-50 flex h-svh w-[var(--sidebar-w)] shrink-0 flex-col gap-3.5 overflow-y-auto border-e border-sidebar-border bg-sidebar px-3 py-[18px] text-sidebar-foreground [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          'max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50 max-lg:w-[min(300px,86vw)] max-lg:transition-transform max-lg:duration-200 max-lg:ease-out',
          mobileSidebarOpen
            ? 'max-lg:translate-x-0 max-lg:shadow-lg'
            : 'max-lg:-translate-x-full max-lg:rtl:translate-x-full',
        )}
        aria-label={t('shell.adminNavigation')}
      >
        <div className="flex items-center gap-2.5 px-2">
          <AdminLogo height={34} className="max-w-[180px]" />
          <button
            type="button"
            className="ms-auto inline-flex size-9 items-center justify-center rounded-full border border-border bg-transparent lg:hidden"
            aria-label={t('shell.closeNavigation')}
            onClick={closeMobileSidebar}
          >
            <X className="size-[18px] stroke-[1.8]" aria-hidden="true" />
          </button>
        </div>

        <PathnameProvider>
          {(pathname) => (
            <nav
              className="flex flex-col gap-2"
              aria-label={t('shell.primaryNav')}
            >
              {sections.map((section) => (
                <div key={section.key} className="flex flex-col gap-px">
                  <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
                    {t(section.labelKey)}
                  </p>

                  <ul className="flex flex-col gap-px">
                    {section.items.map((item) => {
                      const active = isItemActive(pathname, item)

                      return (
                        <li key={item.key}>
                          <NavLinkItem
                            item={item}
                            active={active}
                            onNavigate={closeMobileSidebar}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </PathnameProvider>
      </aside>
    </>
  )
}
