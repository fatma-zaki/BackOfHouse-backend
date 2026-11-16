/**
 * Demo/mock auth types only.
 * Not a production authentication contract.
 */

export type MockSession = {
  authenticated: true
  email: string
  demo: true
}

export type MockLoginFailureCode = 'mock_disabled'

export type MockLoginResult =
  | { ok: true; session: MockSession }
  | { ok: false; code: MockLoginFailureCode }
