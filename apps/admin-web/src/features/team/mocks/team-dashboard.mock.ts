/**
 * DEMO — Team & roles mock data. Not connected to a real auth or RBAC API.
 * Aligned to the product reference matrix and admin list.
 */

import type { TeamDashboardData } from '@/features/team/types/team.types'

export const TEAM_MOCK_DASHBOARD: TeamDashboardData = {
  admins: [
    {
      id: 'nora',
      nameKey: 'noraAlQahtani',
      emailKey: 'noraEmail',
      initials: 'NQ',
      avatarTone: 'violet',
      roleId: 'superAdmin',
      lastActiveKey: 'now',
    },
    {
      id: 'faisal',
      nameKey: 'faisalAlanazi',
      emailKey: 'faisalEmail',
      initials: 'FA',
      avatarTone: 'sky',
      roleId: 'superAdmin',
      lastActiveKey: 'h1',
    },
    {
      id: 'hessa',
      nameKey: 'hessaAlmarri',
      emailKey: 'hessaEmail',
      initials: 'HM',
      avatarTone: 'mint',
      roleId: 'reviewer',
      lastActiveKey: 'today',
    },
    {
      id: 'yousef',
      nameKey: 'yousefAlsaleh',
      emailKey: 'yousefEmail',
      initials: 'YS',
      avatarTone: 'amber',
      roleId: 'reviewer',
      lastActiveKey: 'yesterday',
    },
    {
      id: 'dana',
      nameKey: 'danaAlkhaldi',
      emailKey: 'danaEmail',
      initials: 'DK',
      avatarTone: 'violet',
      roleId: 'editor',
      lastActiveKey: 'today',
    },
    {
      id: 'turki',
      nameKey: 'turkiAlamri',
      emailKey: 'turkiEmail',
      initials: 'TA',
      avatarTone: 'sky',
      roleId: 'support',
      lastActiveKey: 'today',
    },
    {
      id: 'rana',
      nameKey: 'ranaAlbassam',
      emailKey: 'ranaEmail',
      initials: 'RB',
      avatarTone: 'mint',
      roleId: 'analyst',
      lastActiveKey: 'none',
      inviteSentDateKey: 'sep26',
    },
  ],
  permissions: [
    {
      id: 'reviewListings',
      permissionKey: 'reviewListings',
      access: {
        superAdmin: 'allowed',
        reviewer: 'allowed',
        editor: 'none',
        support: 'viewOnly',
        analyst: 'none',
      },
    },
    {
      id: 'verificationDecisions',
      permissionKey: 'verificationDecisions',
      access: {
        superAdmin: 'allowed',
        reviewer: 'allowed',
        editor: 'none',
        support: 'none',
        analyst: 'none',
      },
    },
    {
      id: 'moderationActions',
      permissionKey: 'moderationActions',
      access: {
        superAdmin: 'allowed',
        reviewer: 'allowed',
        editor: 'none',
        support: 'viewOnly',
        analyst: 'none',
      },
    },
    {
      id: 'publishNews',
      permissionKey: 'publishNews',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'allowed',
        support: 'none',
        analyst: 'none',
      },
    },
    {
      id: 'broadcasts',
      permissionKey: 'broadcasts',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'allowed',
        support: 'none',
        analyst: 'none',
      },
    },
    {
      id: 'adjustPoints',
      permissionKey: 'adjustPoints',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'none',
        support: 'allowed',
        analyst: 'none',
      },
    },
    {
      id: 'replyToSupport',
      permissionKey: 'replyToSupport',
      access: {
        superAdmin: 'allowed',
        reviewer: 'viewOnly',
        editor: 'none',
        support: 'allowed',
        analyst: 'none',
      },
    },
    {
      id: 'analyticsReports',
      permissionKey: 'analyticsReports',
      access: {
        superAdmin: 'allowed',
        reviewer: 'viewOnly',
        editor: 'viewOnly',
        support: 'viewOnly',
        analyst: 'allowed',
      },
    },
    {
      id: 'exportPersonalData',
      permissionKey: 'exportPersonalData',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'none',
        support: 'none',
        analyst: 'none',
      },
    },
    {
      id: 'suspendAccounts',
      permissionKey: 'suspendAccounts',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'none',
        support: 'none',
        analyst: 'none',
      },
    },
    {
      id: 'manageTeamSettings',
      permissionKey: 'manageTeamSettings',
      access: {
        superAdmin: 'allowed',
        reviewer: 'none',
        editor: 'none',
        support: 'none',
        analyst: 'none',
      },
    },
  ],
}
