import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BellRing,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart2,
  FileCheck2,
  Gift,
  Handshake,
  Home,
  Inbox,
  LayoutDashboard,
  LineChart,
  Newspaper,
  PenLine,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Store,
  Users,
} from 'lucide-react'
import type { Role } from '@/features/auth/lib/roles'

const ALL_ROLES: Role[] = [
  'superAdmin',
  'reviewer',
  'editor',
  'support',
  'analyst',
]

export type AdminNavItem = {
  key: string
  /** i18n key under the common namespace (e.g. nav.items.overview). */
  labelKey: string
  path: string
  icon: LucideIcon
  /** Roles that can see this item in the sidebar (demo RBAC). */
  roles: readonly Role[]
  /**
   * Optional static demo count for visual parity with the reference sidebar.
   * Not live backend data.
   */
  badge?: number
  /** Extra path prefixes that keep this item highlighted (sub-pages). */
  match?: readonly string[]
}

export type AdminNavSection = {
  key: string
  /** i18n key under the common namespace (e.g. nav.sections.main). */
  labelKey: string
  items: AdminNavItem[]
}

/**
 * Sidebar menu. Each demo role only sees items listed for it
 * (aligned to the reference Team roles matrix).
 */
export const adminNavigation: AdminNavSection[] = [
  {
    key: 'my-work',
    labelKey: 'nav.sections.myWork',
    items: [
      {
        key: 'my-queue',
        labelKey: 'nav.items.myQueue',
        path: '/admin/my-queue',
        icon: ClipboardCheck,
        roles: ['reviewer'],
      },
      {
        key: 'my-desk',
        labelKey: 'nav.items.myDesk',
        path: '/admin/my-desk',
        icon: PenLine,
        roles: ['editor'],
      },
      {
        key: 'my-tickets',
        labelKey: 'nav.items.myTickets',
        path: '/admin/my-tickets',
        icon: Inbox,
        roles: ['support'],
      },
      {
        key: 'analyst-home',
        labelKey: 'nav.items.analystHome',
        path: '/admin/home',
        icon: Home,
        roles: ['analyst'],
      },
    ],
  },
  {
    key: 'main',
    labelKey: 'nav.sections.main',
    items: [
      {
        key: 'overview',
        labelKey: 'nav.items.overview',
        path: '/admin',
        icon: LayoutDashboard,
        roles: ['superAdmin'],
      },
      {
        key: 'analytics',
        labelKey: 'nav.items.analytics',
        path: '/admin/analytics',
        icon: LineChart,
        roles: ALL_ROLES,
      },
      {
        key: 'reports',
        labelKey: 'nav.items.reports',
        path: '/admin/reports',
        icon: FileBarChart2,
        roles: ['superAdmin', 'analyst'],
      },
    ],
  },
  {
    key: 'marketplace',
    labelKey: 'nav.sections.marketplace',
    items: [
      {
        key: 'listings-review',
        labelKey: 'nav.items.listings',
        path: '/admin/listings',
        icon: Store,
        roles: ['superAdmin', 'reviewer'],
        // Static demo count from the reference sidebar — not live data.
        badge: 7,
      },
      {
        key: 'applications',
        labelKey: 'nav.items.applications',
        path: '/admin/applications',
        icon: ClipboardList,
        roles: ['superAdmin'],
      },
      {
        key: 'supplier-requests',
        labelKey: 'nav.items.supplierRequests',
        path: '/admin/supplier-requests',
        icon: Handshake,
        roles: ['superAdmin', 'reviewer'],
      },
    ],
  },
  {
    key: 'people',
    labelKey: 'nav.sections.people',
    items: [
      {
        key: 'users',
        labelKey: 'nav.items.users',
        path: '/admin/users',
        icon: Users,
        roles: ['superAdmin', 'reviewer', 'support'],
      },
      {
        key: 'companies',
        labelKey: 'nav.items.companies',
        path: '/admin/companies',
        icon: Building2,
        roles: ['superAdmin', 'reviewer'],
      },
      {
        key: 'verification',
        labelKey: 'nav.items.verification',
        path: '/admin/verification',
        icon: BadgeCheck,
        roles: ['superAdmin', 'reviewer'],
        // Static demo count from the reference sidebar — not live data.
        badge: 8,
      },
      {
        key: 'claims',
        labelKey: 'nav.items.claimsImports',
        path: '/admin/claims-imports',
        icon: FileCheck2,
        roles: ['superAdmin', 'reviewer'],
        // Static demo count from the reference sidebar — not live data.
        badge: 2,
      },
    ],
  },
  {
    key: 'content',
    labelKey: 'nav.sections.content',
    items: [
      {
        key: 'events',
        labelKey: 'nav.items.events',
        path: '/admin/events',
        icon: CalendarDays,
        roles: ['superAdmin', 'editor'],
      },
      {
        key: 'news',
        labelKey: 'nav.items.news',
        path: '/admin/news',
        icon: Newspaper,
        roles: ['superAdmin', 'editor'],
      },
      {
        key: 'rewards',
        labelKey: 'nav.items.rewards',
        path: '/admin/rewards',
        icon: Gift,
        roles: ['superAdmin', 'support'],
      },
    ],
  },
  {
    key: 'trust-support',
    labelKey: 'nav.sections.trustSupport',
    items: [
      {
        key: 'moderation',
        labelKey: 'nav.items.moderation',
        path: '/admin/moderation',
        icon: Scale,
        roles: ['superAdmin', 'reviewer', 'support'],
        // Static demo count from the reference sidebar — not live data.
        badge: 3,
      },
      {
        key: 'support-inbox',
        labelKey: 'nav.items.support',
        path: '/admin/support',
        icon: Inbox,
        roles: ['superAdmin', 'support'],
        // Static demo count from the reference sidebar — not live data.
        badge: 11,
      },
      {
        key: 'broadcasts',
        labelKey: 'nav.items.broadcasts',
        path: '/admin/broadcasts',
        icon: BellRing,
        roles: ['superAdmin', 'editor'],
      },
    ],
  },
  {
    key: 'system',
    labelKey: 'nav.sections.system',
    items: [
      {
        key: 'team-roles',
        labelKey: 'nav.items.team',
        path: '/admin/team',
        icon: Shield,
        roles: ['superAdmin'],
      },
      {
        key: 'audit-log',
        labelKey: 'nav.items.audit',
        path: '/admin/audit',
        icon: ScrollText,
        roles: ['superAdmin'],
      },
      {
        key: 'settings',
        labelKey: 'nav.items.settings',
        path: '/admin/settings',
        icon: Settings,
        roles: ['superAdmin'],
      },
    ],
  },
]

/** Sections and items visible to the given demo role. */
export function navigationFor(role: Role): AdminNavSection[] {
  return adminNavigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}

/** Brand label used by the admin shell. */
export const adminBrand = {
  name: 'Back of House',
  shortName: 'BOH',
} as const
