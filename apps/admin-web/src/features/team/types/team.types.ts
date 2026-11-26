export type TeamAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type TeamRoleId =
  | 'superAdmin'
  | 'reviewer'
  | 'editor'
  | 'support'
  | 'analyst'

export type TeamLastActiveKey = 'now' | 'h1' | 'today' | 'yesterday' | 'none'

export type TeamPermissionLevel = 'allowed' | 'viewOnly' | 'none'

export type TeamAdminRow = {
  id: string
  nameKey: string
  emailKey: string
  initials: string
  avatarTone: TeamAvatarTone
  roleId: TeamRoleId
  lastActiveKey: TeamLastActiveKey
  inviteSentDateKey?: string
}

export type TeamPermissionRow = {
  id: string
  permissionKey: string
  access: Record<TeamRoleId, TeamPermissionLevel>
}

export type TeamDashboardData = {
  admins: TeamAdminRow[]
  permissions: TeamPermissionRow[]
}

export const TEAM_ROLE_IDS = [
  'superAdmin',
  'reviewer',
  'editor',
  'support',
  'analyst',
] as const satisfies readonly TeamRoleId[]
