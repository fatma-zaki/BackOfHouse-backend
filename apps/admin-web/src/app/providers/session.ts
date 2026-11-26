import { createContext, useContext } from 'react'
import type {
  Access,
  DemoSessionUser,
  Permission,
  Role,
} from '@/features/auth/lib/roles'

export type SessionContextValue = {
  role: Role
  user: DemoSessionUser
  setRole: (role: Role) => void
  can: (permission: Permission, level?: Access) => boolean
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>')
  }
  return ctx
}
