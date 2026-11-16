import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function VerificationInfoBanner() {
  const { t } = useTranslation()

  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/8 px-3.5 py-3 text-[13px] leading-snug text-foreground"
    >
      <Shield
        className="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p>{t('verification.infoBanner')}</p>
    </div>
  )
}
