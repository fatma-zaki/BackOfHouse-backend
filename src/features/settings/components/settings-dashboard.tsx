import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CardSkeleton } from '@/components/shared/card-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { SettingsCategoriesCitiesCard } from '@/features/settings/components/settings-categories-cities-card'
import { SettingsGeneralPanel } from '@/features/settings/components/settings-general-panel'
import { SettingsHeader } from '@/features/settings/components/settings-header'
import { SettingsLanguagesPanel } from '@/features/settings/components/settings-languages-panel'
import { SettingsLegalPrivacyPanel } from '@/features/settings/components/settings-legal-privacy-panel'
import { SettingsNotificationsPanel } from '@/features/settings/components/settings-notifications-panel'
import { SettingsPointsRulesCard } from '@/features/settings/components/settings-points-rules-card'
import { SettingsReviewSafetyCard } from '@/features/settings/components/settings-review-safety-card'
import { SettingsSidebarNav } from '@/features/settings/components/settings-sidebar-nav'
import { useSettingsDashboard } from '@/features/settings/hooks/use-settings-dashboard'
import type {
  CategoryChipGroup,
  PointsRuleRow,
  SettingsGeneral,
  SettingsLanguages,
  SettingsSectionId,
  ToggleSettingRow,
} from '@/features/settings/types/settings.types'
import {
  PLATFORM_RULE_SECTIONS,
  settingsSectionAnchor,
} from '@/features/settings/types/settings.types'

export function SettingsDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch, isSuccess } =
    useSettingsDashboard()

  const [section, setSection] = useState<SettingsSectionId>('pointsRules')
  const [dirty, setDirty] = useState(false)
  const [general, setGeneral] = useState<SettingsGeneral | null>(null)
  const [rules, setRules] = useState<PointsRuleRow[]>([])
  const [groups, setGroups] = useState<CategoryChipGroup[]>([])
  const [safety, setSafety] = useState<ToggleSettingRow[]>([])
  const [notifications, setNotifications] = useState<ToggleSettingRow[]>([])
  const [languages, setLanguages] = useState<SettingsLanguages | null>(null)

  useEffect(() => {
    if (!isSuccess || !data) return
    setGeneral(data.general)
    setRules(data.pointsRules)
    setGroups(data.categoryGroups)
    setSafety(data.reviewSafety)
    setNotifications(data.notifications)
    setLanguages(data.languages)
    setDirty(false)
  }, [data, isSuccess])

  const touch = <T,>(apply: (current: T) => T, set: (next: T) => void, current: T) => {
    set(apply(current))
    setDirty(true)
  }

  const go = (next: SettingsSectionId) => {
    setSection(next)
    if (PLATFORM_RULE_SECTIONS.includes(next)) {
      requestAnimationFrame(() => {
        document
          .getElementById(settingsSectionAnchor(next))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const save = () => {
    setDirty(false)
    toast.success(t('settings.toasts.saved'))
  }

  const showPlatformRules = PLATFORM_RULE_SECTIONS.includes(section)

  return (
    <div className="flex flex-col gap-4">
      <SettingsHeader dirty={dirty} onSave={save} />

      {!isPending && isError ? (
        <ErrorState
          title={t('settings.states.errorTitle')}
          description={t('settings.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(12.5rem,13.75rem)_minmax(0,1fr)]">
          <SettingsSidebarNav section={section} onSectionChange={go} />

          <div className="flex min-w-0 flex-col gap-4">
            {showPlatformRules ? (
              <>
                <SettingsPointsRulesCard
                  id={settingsSectionAnchor('pointsRules')}
                  rows={rules}
                  isLoading={isPending}
                  onPointsChange={(id, points) =>
                    touch(
                      (current) =>
                        current.map((row) =>
                          row.id === id ? { ...row, points } : row,
                        ),
                      setRules,
                      rules,
                    )
                  }
                  onToggle={(id, enabled) =>
                    touch(
                      (current) =>
                        current.map((row) =>
                          row.id === id ? { ...row, enabled } : row,
                        ),
                      setRules,
                      rules,
                    )
                  }
                />

                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                  <SettingsCategoriesCitiesCard
                    id={settingsSectionAnchor('categoriesCities')}
                    groups={groups}
                    isLoading={isPending}
                    onGroupChange={(groupId, items) =>
                      touch(
                        (current) =>
                          current.map((group) =>
                            group.id === groupId
                              ? { ...group, items }
                              : group,
                          ),
                        setGroups,
                        groups,
                      )
                    }
                  />
                  <SettingsReviewSafetyCard
                    id={settingsSectionAnchor('reviewSafety')}
                    rows={safety}
                    isLoading={isPending}
                    onToggle={(id, enabled) =>
                      touch(
                        (current) =>
                          current.map((row) =>
                            row.id === id ? { ...row, enabled } : row,
                          ),
                        setSafety,
                        safety,
                      )
                    }
                  />
                </div>
              </>
            ) : null}

            {section === 'general' ? (
              isPending ? (
                <CardSkeleton
                  lines={5}
                  label={t('settings.states.loading')}
                />
              ) : general ? (
                <SettingsGeneralPanel
                  value={general}
                  onChange={(next) => {
                    setGeneral(next)
                    setDirty(true)
                  }}
                />
              ) : null
            ) : null}

            {section === 'notifications' ? (
              isPending ? (
                <CardSkeleton
                  lines={6}
                  label={t('settings.states.loading')}
                />
              ) : (
                <SettingsNotificationsPanel
                  rows={notifications}
                  onToggle={(id, enabled) =>
                    touch(
                      (current) =>
                        current.map((row) =>
                          row.id === id ? { ...row, enabled } : row,
                        ),
                      setNotifications,
                      notifications,
                    )
                  }
                />
              )
            ) : null}

            {section === 'legalPrivacy' ? (
              isPending ? (
                <CardSkeleton
                  lines={5}
                  label={t('settings.states.loading')}
                />
              ) : data ? (
                <SettingsLegalPrivacyPanel docs={data.legalDocs} />
              ) : null
            ) : null}

            {section === 'languages' ? (
              isPending ? (
                <CardSkeleton
                  lines={4}
                  label={t('settings.states.loading')}
                />
              ) : languages ? (
                <SettingsLanguagesPanel
                  value={languages}
                  onChange={(next) => {
                    setLanguages(next)
                    setDirty(true)
                  }}
                />
              ) : null
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
