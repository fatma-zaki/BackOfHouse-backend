export type SettingsSectionId =
  | 'general'
  | 'pointsRules'
  | 'categoriesCities'
  | 'reviewSafety'
  | 'notifications'
  | 'legalPrivacy'
  | 'languages'

/** Sections that share the combined platform-rules layout (scroll anchors). */
export const PLATFORM_RULE_SECTIONS: readonly SettingsSectionId[] = [
  'pointsRules',
  'categoriesCities',
  'reviewSafety',
]

export type PointsRuleRow = {
  id: string
  activityKey: string
  /** Stored as digits string so the points input matches the reference UX. */
  points: string
  limitKey: string
  /** Locked rules can't be switched off or have points edited. */
  locked?: boolean
  enabled: boolean
}

export type CategoryChipGroup = {
  id: string
  labelKey: string
  /** Known item keys or free-text values added by the admin. */
  items: string[]
}

export type ToggleSettingRow = {
  id: string
  enabled: boolean
}

export type SettingsGeneral = {
  name: string
  email: string
  timezone: string
}

export type SettingsLanguages = {
  arabic: boolean
  defaultLanguage: 'english' | 'arabic'
}

export type LegalDocRow = {
  id: string
  updatedKey: string
}

export type SettingsDashboardData = {
  general: SettingsGeneral
  pointsRules: PointsRuleRow[]
  categoryGroups: CategoryChipGroup[]
  reviewSafety: ToggleSettingRow[]
  notifications: ToggleSettingRow[]
  legalDocs: LegalDocRow[]
  languages: SettingsLanguages
}

export function settingsSectionAnchor(section: SettingsSectionId): string {
  return `settings-${section}`
}
