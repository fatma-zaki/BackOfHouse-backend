/**
 * Development / demo mock authentication only.
 *
 * - Not production security and not a real auth backend.
 * - VITE_MOCK_AUTH_ENABLED is public client-side configuration (bundled into
 *   the browser) and must never be treated as a security boundary.
 * - No demo email/password credentials are stored in source or env vars.
 * - Session is in-memory only; a full page refresh clears it.
 * - Submitted passwords are never persisted.
 */

import type { MockLoginResult, MockSession } from '@/features/auth/types/auth.types'

let mockSession: MockSession | null = null

/** Enabled only when the flag is exactly the string `"true"`. */
export function isMockAuthEnabled(): boolean {
  return import.meta.env.VITE_MOCK_AUTH_ENABLED === 'true'
}

export function getMockSession(): MockSession | null {
  return mockSession
}

export function clearMockSession(): void {
  mockSession = null
}

/**
 * Accepts any already-validated email + password when mock mode is enabled.
 * Call only after Zod validation (work email, password length ≥ 8, 6-digit OTP).
 * Password/OTP are intentionally unused here and never stored — demo gate only.
 */
export function mockLogin(email: string, _password: string): MockLoginResult {
  if (!isMockAuthEnabled()) {
    clearMockSession()
    return { ok: false, code: 'mock_disabled' }
  }

  const session: MockSession = {
    authenticated: true,
    email,
    demo: true,
  }

  mockSession = session
  return { ok: true, session }
}
