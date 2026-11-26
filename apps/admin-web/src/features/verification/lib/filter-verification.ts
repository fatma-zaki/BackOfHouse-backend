import type {
  VerificationQueueStatusId,
  VerificationRequest,
  VerificationTabId,
} from '@/features/verification/types/verification.types'

const WAITING_STATUSES: readonly VerificationQueueStatusId[] = ['waiting']

export function isOpenVerificationRequest(
  statusId: VerificationQueueStatusId,
): boolean {
  return statusId === 'waiting' || statusId === 'moreInfo'
}

export function matchesVerificationTab(
  request: VerificationRequest,
  tab: VerificationTabId,
): boolean {
  switch (tab) {
    case 'waiting':
      return WAITING_STATUSES.includes(request.queueStatusId)
    case 'moreInfo':
      return request.queueStatusId === 'moreInfo'
    case 'decided':
      return (
        request.queueStatusId === 'approved' ||
        request.queueStatusId === 'rejected'
      )
  }
}

export function filterVerificationRequests(
  rows: readonly VerificationRequest[],
  tab: VerificationTabId,
): VerificationRequest[] {
  return rows.filter((row) => matchesVerificationTab(row, tab))
}

export function countVerificationByTab(
  rows: readonly VerificationRequest[],
): Record<VerificationTabId, number> {
  return {
    waiting: rows.filter((row) => matchesVerificationTab(row, 'waiting'))
      .length,
    moreInfo: rows.filter((row) => matchesVerificationTab(row, 'moreInfo'))
      .length,
    decided: rows.filter((row) => matchesVerificationTab(row, 'decided'))
      .length,
  }
}
