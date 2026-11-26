/**
 * DEMO / ILLUSTRATIVE — User detail for Reem Alharbi and minimal list-backed details.
 */

import { USERS_MOCK_ROWS } from '@/features/users/mocks/users-dashboard.mock'
import type {
  UserDetailData,
  UserDetailProfile,
  UserRow,
  UserTypeId,
} from '@/features/users/types/users.types'

export const REEM_ALHARBI_DETAIL: UserDetailData = {
  profile: {
    id: 'reem-alharbi',
    nameKey: 'reemAlharbi',
    emailKey: 'reemEmail',
    phoneKey: 'reemPhone',
    universityKey: 'reemUniversity',
    initials: 'RA',
    avatarTone: 'violet',
    verified: true,
    typeIds: ['individual', 'student'],
    cityId: 'riyadh',
    memberSinceKey: 'mar2025',
    verifiedMetaKey: 'reemVerifiedMeta',
    lastActiveKey: 'reemLastActive',
    subtitleTypeKeys: ['individual', 'student'],
  },
  kpis: [
    { id: 'pointsBalance', value: '2,450' },
    { id: 'applications', value: '12' },
    { id: 'eventsAttended', value: '9' },
    { id: 'reportsAgainst', value: '0' },
  ],
  pointsEntries: [
    {
      id: 'p1',
      dateKey: 'sep26',
      activityKey: 'attendedRiyadhTech',
      sourceId: 'checkInScan',
      sourceTone: 'success',
      points: 150,
    },
    {
      id: 'p2',
      dateKey: 'sep20',
      activityKey: 'redeemedHighlight',
      sourceId: 'reward',
      sourceTone: 'violet',
      points: -500,
    },
    {
      id: 'p3',
      dateKey: 'sep5',
      activityKey: 'manualSep5Event',
      sourceId: 'manualFaisal',
      sourceTone: 'warning',
      points: 200,
    },
    {
      id: 'p4',
      dateKey: 'aug28',
      activityKey: 'profileComplete',
      sourceId: 'system',
      sourceTone: 'neutral',
      points: 50,
    },
    {
      id: 'p5',
      dateKey: 'aug14',
      activityKey: 'companyReferral',
      sourceId: 'company',
      sourceTone: 'info',
      points: 100,
    },
  ],
  internalNotes: [
    {
      id: 'n1',
      authorInitials: 'FA',
      authorNameKey: 'faisalAdmin',
      dateKey: 'sep12',
      bodyKey: 'reemNoteSep12',
    },
  ],
}

function typeIdsFromRow(row: UserRow): UserTypeId[] {
  if (row.typeId === 'individual' && row.isStudent) {
    return ['individual', 'student']
  }
  return [row.typeId]
}

function minimalDetailFromRow(row: UserRow): UserDetailData {
  const typeIds = typeIdsFromRow(row)
  const profile: UserDetailProfile = {
    id: row.id,
    nameKey: row.nameKey,
    emailKey: row.emailKey,
    phoneKey: 'genericPhone',
    initials: row.initials,
    avatarTone: row.avatarTone,
    verified: row.verified,
    typeIds,
    cityId: row.cityId,
    memberSinceKey: row.joinedKey,
    lastActiveKey: row.lastActiveKey,
    subtitleTypeKeys: typeIds,
  }

  const pointsValue =
    row.points === null ? '—' : String(row.points)

  return {
    profile,
    kpis: [
      { id: 'pointsBalance', value: pointsValue },
      { id: 'applications', value: '0' },
      { id: 'eventsAttended', value: '0' },
      { id: 'reportsAgainst', value: '0' },
    ],
    pointsEntries: [],
    internalNotes: [],
  }
}

export function getUserDetailMock(userId: string): UserDetailData | null {
  if (userId === 'reem-alharbi') {
    return {
      profile: { ...REEM_ALHARBI_DETAIL.profile },
      kpis: REEM_ALHARBI_DETAIL.kpis.map((k) => ({ ...k })),
      pointsEntries: REEM_ALHARBI_DETAIL.pointsEntries.map((e) => ({ ...e })),
      internalNotes: REEM_ALHARBI_DETAIL.internalNotes.map((n) => ({ ...n })),
    }
  }

  const row = USERS_MOCK_ROWS.find((item) => item.id === userId)
  if (!row) return null

  return minimalDetailFromRow(row)
}
