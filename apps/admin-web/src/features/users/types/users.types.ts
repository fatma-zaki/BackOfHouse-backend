export type UsersTabId = 'all' | 'individuals' | 'companies' | 'suspended'

export const USERS_TAB_IDS: readonly UsersTabId[] = [
  'all',
  'individuals',
  'companies',
  'suspended',
] as const

export type UserTypeId = 'individual' | 'company' | 'student'

export type UserAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type UserVerificationFilter = 'all' | 'verified' | 'notVerified'

export type UserStudentsFilter = 'all' | 'students' | 'nonStudents'

export type UserJoinedFilter = 'all' | 'last30' | 'last90' | 'lastYear'

export type UserRow = {
  id: string
  nameKey: string
  emailKey: string
  initials: string
  avatarTone: UserAvatarTone
  typeId: UserTypeId
  cityId: string
  points: number | null
  verified: boolean
  joinedKey: string
  lastActiveKey: string
  suspended?: boolean
  isStudent?: boolean
}

export type UsersTabCounts = Record<UsersTabId, number>

export type UsersDashboardData = {
  tabCounts: UsersTabCounts
  users: readonly UserRow[]
}

export type UserDetailTabId =
  | 'points'
  | 'applications'
  | 'events'
  | 'reports'
  | 'devices'

export type UserPointsSourceTone =
  | 'success'
  | 'violet'
  | 'warning'
  | 'neutral'
  | 'info'

export type UserPointsEntry = {
  id: string
  dateKey: string
  activityKey: string
  sourceId: string
  sourceTone: UserPointsSourceTone
  points: number
}

export type UserDetailKpiId =
  | 'pointsBalance'
  | 'applications'
  | 'eventsAttended'
  | 'reportsAgainst'

export type UserDetailKpi = {
  id: UserDetailKpiId
  value: string
}

export type UserAdminActionId =
  | 'adjustPoints'
  | 'resetPassword'
  | 'removeVerification'
  | 'dataRequest'
  | 'suspendAccount'

export type UserInternalNote = {
  id: string
  authorInitials: string
  authorNameKey: string
  dateKey: string
  bodyKey: string
}

export type UserDetailProfile = {
  id: string
  nameKey: string
  emailKey: string
  phoneKey: string
  universityKey?: string
  initials: string
  avatarTone: UserAvatarTone
  verified: boolean
  typeIds: readonly UserTypeId[]
  cityId: string
  memberSinceKey: string
  verifiedMetaKey?: string
  lastActiveKey: string
  subtitleTypeKeys: readonly string[]
}

export type UserDetailData = {
  profile: UserDetailProfile
  kpis: readonly UserDetailKpi[]
  pointsEntries: readonly UserPointsEntry[]
  internalNotes: readonly UserInternalNote[]
}
