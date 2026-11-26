import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getMockSession,
  isMockAuthEnabled,
} from '@/features/auth/lib/mock-auth'

type MockAuthRouteGuardProps = {
  children: ReactNode
}

/**
 * Demo-only UX gate for admin routes when mock auth is enabled.
 *
 * - NOT production security and NOT a server-side authorization boundary.
 * - Uses the in-memory mock session from `mock-auth` only.
 * - When `VITE_MOCK_AUTH_ENABLED` is not exactly `"true"`, children render
 *   unchanged (no production auth is invented).
 */
export function MockAuthRouteGuard({ children }: MockAuthRouteGuardProps) {
  if (!isMockAuthEnabled()) {
    return children
  }

  const session = getMockSession()
  if (!session?.authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
