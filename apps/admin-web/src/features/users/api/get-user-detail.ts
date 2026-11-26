/**
 * Local async adapter over User detail mock data.
 */

import { getUserDetailMock } from '@/features/users/mocks/user-detail.mock'
import type { UserDetailData } from '@/features/users/types/users.types'

const MOCK_LATENCY_MS = 140

export class UserDetailNotFoundError extends Error {
  readonly code = 'user_not_found' as const

  constructor(userId: string) {
    super(`User not found: ${userId}`)
    this.name = 'UserDetailNotFoundError'
  }
}

export async function getUserDetail(userId: string): Promise<UserDetailData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  if (!userId.trim()) {
    throw new UserDetailNotFoundError(userId)
  }

  const detail = getUserDetailMock(userId)
  if (!detail) {
    throw new UserDetailNotFoundError(userId)
  }

  return detail
}
