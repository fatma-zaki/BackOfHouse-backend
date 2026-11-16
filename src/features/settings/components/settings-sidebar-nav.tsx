import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SettingsSectionId } from '@/features/settings/types/settings.types'

const SECTIONS: readonly SettingsSectionId[] = [
  'general',
  'pointsRules',
  'categoriesCities',
  'reviewSafety',
  'notifications',
  'legalPrivacy',
  'languages',
]

type SettingsSidebarNavProps = {
  section: SettingsSectionId
  onSectionChange: (section: SettingsSectionId) => void
}

export function SettingsSidebarNav({
  section,
  onSectionChange,
}: SettingsSidebarNavProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 py-0 shadow-sm">
      <CardContent className="p-2.5">
        <nav aria-label={t('settings.nav.label')}>
          <ul className="flex flex-row gap-0.5 overflow-x-auto xl:flex-col">
            {SECTIONS.map((sectionId) => {
              const active = section === sectionId
              return (
                <li key={sectionId} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSectionChange(sectionId)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'h-9 w-full whitespace-nowrap rounded-md px-3 text-start text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-primary/10 font-bold text-primary'
                        : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {t(`settings.nav.sections.${sectionId}`)}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}
