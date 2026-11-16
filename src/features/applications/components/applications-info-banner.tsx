import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ApplicationsInfoBanner() {
  const { t } = useTranslation()

  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-info/20 bg-info/10 px-3.5 py-3 text-[13px] leading-snug text-foreground"
    >
      <Info
        className="mt-0.5 size-4 shrink-0 text-info"
        aria-hidden="true"
      />
      <p>{t('applications.infoBanner')}</p>
    </div>
  )
}
