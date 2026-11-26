export type VerificationTabId = 'waiting' | 'moreInfo' | 'decided'

export type VerificationQueueStatusId =
  | 'waiting'
  | 'moreInfo'
  | 'approved'
  | 'rejected'

export type VerificationApplicantTypeId = 'company' | 'pro' | 'student'

export type VerificationSlaTone = 'warning' | 'success' | 'muted' | 'danger'

export type VerificationAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type VerificationCheckState = 'pass' | 'warn' | 'fail'

export type VerificationCheck = {
  state: VerificationCheckState
  textKey: string
}

export type VerificationFact = {
  labelKey: string
  valueKey: string
}

export type VerificationDocument = {
  id: string
  fileNameKey: string
  sizeKey: string
  previewCaptionKey: string
}

export type VerificationRequest = {
  id: string
  nameKey: string
  initials: string
  avatarTone: VerificationAvatarTone
  applicantTypeId: VerificationApplicantTypeId
  /** Optional second line in list meta (role, doc type label, etc.). */
  listSubtitleKey?: string
  documentCount: number
  cityId: string
  slaLabelKey: string
  slaTone: VerificationSlaTone
  queueStatusId: VerificationQueueStatusId
  requestedMeta: {
    typeLabelKey: string
    requesterKey: string
    requesterRoleKey: string
    submittedKey: string
  }
  facts: readonly VerificationFact[]
  checks: readonly VerificationCheck[]
  documents: readonly VerificationDocument[]
  defaultDocumentId: string
}

export type VerificationReviewData = {
  requests: readonly VerificationRequest[]
  tabCounts: Record<VerificationTabId, number>
}
