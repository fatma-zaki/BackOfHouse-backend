import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SettingsSectionId } from '@/features/settings/types/settings.types'

type SettingsSectionPlaceholderProps = {
  section: SettingsSectionId
}

export function SettingsSectionPlaceholder({
  section,
}: SettingsSectionPlaceholderProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold">
          {t(`settings.nav.sections.${section}`)}
        </CardTitle>
        <CardDescription>{t('settings.placeholder.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t('settings.placeholder.body')}
        </p>
      </CardContent>
    </Card>
  )
}
