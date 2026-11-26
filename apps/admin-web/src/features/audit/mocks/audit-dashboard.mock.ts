/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Audit log scaffolding aligned to the product reference.
 * NOT production audit data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import { AUDIT_DEFAULT_RANGE } from '@/features/audit/constants'
import type { AuditDashboardData, AuditRow } from '@/features/audit/types/audit.types'

/** @deprecated Prefer AUDIT_DEFAULT_RANGE from constants. */
export const AUDIT_MOCK_DEFAULT_RANGE = AUDIT_DEFAULT_RANGE

export const AUDIT_MOCK_TOTAL_COUNT = 9_204

export const AUDIT_MOCK_ROWS: readonly AuditRow[] = [
  {
    id: 'sep28-export-applications',
    whenKey: 'sep28_1042',
    adminKey: 'noraAlQahtani',
    initials: 'NQ',
    avatarTone: 'violet',
    actionId: 'exportedData',
    actionCategory: 'exports',
    targetKey: 'applicationsSepExcel',
    detailsKey: 'rows4870',
  },
  {
    id: 'sep28-requested-changes-coop',
    whenKey: 'sep28_1015',
    adminKey: 'hessaAlmarri',
    initials: 'HM',
    avatarTone: 'sky',
    actionId: 'requestedChanges',
    actionCategory: 'decisions',
    targetKey: 'listingSummerCoop',
    detailsKey: 'addWorkingHours',
  },
  {
    id: 'sep28-adjusted-points-reem',
    whenKey: 'sep28_0958',
    adminKey: 'faisalAlanazi',
    initials: 'FA',
    avatarTone: 'mint',
    actionId: 'adjustedPoints',
    actionCategory: 'points',
    targetKey: 'userReemAlharbi',
    detailsKey: 'plus150ScannerOffline',
  },
  {
    id: 'sep28-approved-verification',
    whenKey: 'sep28_0930',
    adminKey: 'yousefAlsaleh',
    initials: 'YS',
    avatarTone: 'amber',
    actionId: 'approvedVerification',
    actionCategory: 'decisions',
    targetKey: 'companyRiyadhFrontEvents',
    detailsKey: 'documentsChecked3',
  },
  {
    id: 'sep28-suspended-quick-crew',
    whenKey: 'sep28_0902',
    adminKey: 'turkiAlamri',
    initials: 'TA',
    avatarTone: 'rose',
    actionId: 'suspendedAccount',
    actionCategory: 'access',
    targetKey: 'companyQuickCrewKsa',
    detailsKey: 'reports7UnpaidCrew',
  },
  {
    id: 'sep27-published-story',
    whenKey: 'sep27_1820',
    adminKey: 'danaAlkhaldi',
    initials: 'DK',
    avatarTone: 'slate',
    actionId: 'publishedStory',
    actionCategory: 'general',
    targetKey: 'newsJeddahDesignWeek',
  },
  {
    id: 'sep27-changed-role-rana',
    whenKey: 'sep27_1705',
    adminKey: 'noraAlQahtani',
    initials: 'NQ',
    avatarTone: 'violet',
    actionId: 'changedRole',
    actionCategory: 'access',
    targetKey: 'adminRanaAlbassam',
    detailsKey: 'invitedAsAnalyst',
  },
  {
    id: 'sep27-signed-in-faisal',
    whenKey: 'sep27_1648',
    adminKey: 'faisalAlanazi',
    initials: 'FA',
    avatarTone: 'mint',
    actionId: 'signedIn',
    actionCategory: 'access',
    targetKey: 'backOffice',
    detailsKey: 'riyadhChrome2Step',
  },
]

export const AUDIT_MOCK_DASHBOARD: AuditDashboardData = {
  range: {
    from: AUDIT_MOCK_DEFAULT_RANGE.from.toISOString(),
    to: AUDIT_MOCK_DEFAULT_RANGE.to.toISOString(),
  },
  entries: AUDIT_MOCK_ROWS,
  totalCount: AUDIT_MOCK_TOTAL_COUNT,
}
