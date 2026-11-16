import { useTranslation } from 'react-i18next'
import { LoginBrandingPanel } from '@/features/auth/components/login-branding-panel'
import { LoginForm } from '@/features/auth/components/login-form'
import { cn } from '@/lib/utils'

function resolveActiveLanguage(language: string): 'en' | 'ar' {
  return language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const activeLanguage = resolveActiveLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  )

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[#F7F7FF] lg:flex-row">
      <LoginBrandingPanel />

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F7F7FF]">
        <div className="absolute top-3 end-3 z-20 sm:top-4 sm:end-4 lg:top-6 lg:end-6">
          <div
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F0F0F5] p-1"
            role="group"
            aria-label={t('login.language.label')}
          >
            <button
              type="button"
              onClick={() => {
                void i18n.changeLanguage('en')
              }}
              aria-pressed={activeLanguage === 'en'}
              aria-label={t('language.en')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6437FA]',
                activeLanguage === 'en'
                  ? 'bg-white font-bold text-[#6437FA] shadow-sm'
                  : 'bg-transparent text-[#6B7280] hover:text-[#1A1A2E]',
              )}
            >
              {t('language.en')}
            </button>
            <button
              type="button"
              onClick={() => {
                void i18n.changeLanguage('ar')
              }}
              aria-pressed={activeLanguage === 'ar'}
              aria-label={t('language.ar')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6437FA]',
                activeLanguage === 'ar'
                  ? 'bg-white font-bold text-[#6437FA] shadow-sm'
                  : 'bg-transparent text-[#6B7280] hover:text-[#1A1A2E]',
              )}
            >
              {t('language.ar')}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
          <LoginForm />
        </div>
      </section>
    </div>
  )
}
