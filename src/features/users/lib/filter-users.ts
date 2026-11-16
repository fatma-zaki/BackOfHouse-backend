import type {
  UserJoinedFilter,
  UserRow,
  UsersTabId,
  UserStudentsFilter,
  UserVerificationFilter,
} from '@/features/users/types/users.types'

export function matchesUsersTab(row: UserRow, tab: UsersTabId): boolean {
  if (row.suspended) {
    return tab === 'suspended' || tab === 'all'
  }
  switch (tab) {
    case 'all':
      return true
    case 'individuals':
      return row.typeId === 'individual' && !row.suspended
    case 'companies':
      return row.typeId === 'company'
    case 'suspended':
      return Boolean(row.suspended)
  }
}

function matchesJoinedFilter(
  row: UserRow,
  joined: UserJoinedFilter,
): boolean {
  if (joined === 'all') return true
  const order = joinedOrder(row.joinedKey)
  switch (joined) {
    case 'last30':
      return order <= 30
    case 'last90':
      return order <= 90
    case 'lastYear':
      return order <= 365
  }
}

/** Lower = more recent (demo ordering by joinedKey). */
const JOINED_ORDER: Record<string, number> = {
  sep2025: 14,
  aug2025: 45,
  jul2025: 75,
  jun2025: 105,
  may2025: 135,
  apr2025: 165,
  mar2025: 195,
  feb2025: 225,
  jan2025: 255,
  dec2024: 285,
}

function joinedOrder(joinedKey: string): number {
  return JOINED_ORDER[joinedKey] ?? 999
}

export function filterUsers(
  rows: readonly UserRow[],
  options: {
    tab: UsersTabId
    cityId: string
    verified: UserVerificationFilter
    students: UserStudentsFilter
    joined: UserJoinedFilter
  },
): UserRow[] {
  return rows.filter((row) => {
    if (!matchesUsersTab(row, options.tab)) return false
    if (options.cityId !== 'all' && row.cityId !== options.cityId) {
      return false
    }
    if (options.verified === 'verified' && !row.verified) return false
    if (options.verified === 'notVerified' && row.verified) return false
    if (
      options.students === 'students' &&
      !(row.typeId === 'student' || row.isStudent)
    ) {
      return false
    }
    if (
      options.students === 'nonStudents' &&
      (row.typeId === 'student' || row.isStudent)
    ) {
      return false
    }
    if (!matchesJoinedFilter(row, options.joined)) return false
    return true
  })
}

export function uniqueOptionValues(
  rows: readonly UserRow[],
  pick: (row: UserRow) => string,
): string[] {
  return [...new Set(rows.map(pick))].sort((a, b) => a.localeCompare(b))
}

export function paginateRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
