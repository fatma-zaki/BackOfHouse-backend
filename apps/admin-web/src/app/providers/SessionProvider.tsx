import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  can as roleCan,
  isRole,
  ROLE_USER,
  ROLES,
  type Access,
  type Permission,
  type Role,
} from '@/features/auth/lib/roles'
import { SessionContext, useSession, type SessionContextValue } from './session'

/** Demo role preference only — not a production auth token. */
const ROLE_STORAGE_KEY = 'boh.role'

function readStoredRole(): Role {
  try {
    if (typeof localStorage === 'undefined') return ROLES[0]
    const fromUrl = new URLSearchParams(window.location.search).get('role')
    if (isRole(fromUrl)) {
      localStorage.setItem(ROLE_STORAGE_KEY, fromUrl)
      return fromUrl
    }
    const stored = localStorage.getItem(ROLE_STORAGE_KEY)
    return isRole(stored) ? stored : ROLES[0]
  } catch {
    return ROLES[0]
  }
}

function persistRole(role: Role) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(ROLE_STORAGE_KEY, role)
  } catch {
    // Storage may be unavailable (private mode, quotas, policies).
  }
}

/**
 * Mock session for demo role switching and permission checks.
 * Swap for the real auth source when the API lands.
 * Not production security.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readStoredRole())

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    persistRole(next)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      role,
      user: ROLE_USER[role],
      setRole,
      can: (permission, level) => roleCan(role, permission, level),
    }),
    [role, setRole],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

/** Renders children only when the current demo role has the permission. */
export function Can({
  permission,
  level = 'full',
  children,
}: {
  permission: Permission
  level?: Access
  children: ReactNode
}) {
  return useSession().can(permission, level) ? <>{children}</> : null
}
