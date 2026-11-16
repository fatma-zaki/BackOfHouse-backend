import { useTranslation } from 'react-i18next'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SettingsEditableChips } from '@/features/settings/components/settings-editable-chips'
import type { CategoryChipGroup } from '@/features/settings/types/settings.types'

type SettingsCategoriesCitiesCardProps = {
  id?: string
  groups: readonly CategoryChipGroup[]
  isLoading?: boolean
  onGroupChange: (groupId: string, items: string[]) => void
}

export function SettingsCategoriesCitiesCard({
  id,
  groups,
  isLoading = false,
  onGroupChange,
}: SettingsCategoriesCitiesCardProps) {
  const { t } = useTranslation()

  return (
    <Card id={id} className="min-w-0 flex-1 gap-0 py-0 shadow-sm">
      <CardHeader className="px-4 py-4">
        <CardTitle className="text-base font-bold">
          {t('settings.categories.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4">
        {isLoading ? (
          <FormSkeleton fields={3} label={t('settings.states.loading')} />
        ) : (
          groups.map((group) => (
            <SettingsEditableChips
              key={group.id}
              labelKey={group.labelKey}
              items={group.items}
              onChange={(items) => onGroupChange(group.id, items)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
