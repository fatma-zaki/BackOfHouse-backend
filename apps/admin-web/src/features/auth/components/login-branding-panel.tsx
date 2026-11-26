import { useTranslation } from 'react-i18next'
import { BRAND_LOGO_SRC } from '@/constants/brand'

const LOGIN_BG_SRC = '/auth/login-bg.webp'

/**
 * Left branding panel for the Login page.
 * Uses user-provided originals at /auth/logo.svg and /auth/login-bg.webp.
 * The supplied logo asset already includes the ADMIN badge.
 */
export function LoginBrandingPanel() {
  const { t } = useTranslation()

  return (
    <aside
      className="relative flex h-[min(32svh,240px)] w-full shrink-0 flex-col overflow-hidden bg-[#05050D] lg:h-full lg:min-h-0 lg:w-[min(620px,42%)]"
      aria-label={t('login.branding.regionLabel')}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${LOGIN_BG_SRC})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-[#05050D]/75 via-[#1a0b3d]/55 to-[#6437FA]/30"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col justify-between gap-6 p-6 sm:p-8 lg:gap-10 lg:p-10">
        <div>
          <img
            src={BRAND_LOGO_SRC}
            alt={t('login.branding.logoAlt')}
            className="h-10 w-auto max-w-[220px] object-contain object-start sm:h-12 sm:max-w-[260px]"
          />
        </div>

        <div className="max-w-[22rem] pb-1 sm:max-w-[26rem] lg:pb-4">
          <span
            className="mb-5 block text-[1.75rem] font-bold leading-none text-[#6437FA]"
            aria-hidden="true"
          >
            /
          </span>
          <h1 className="whitespace-pre-line text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2rem] lg:text-[2.35rem] lg:leading-[1.12]">
            {t('login.branding.headline')}
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/75 sm:text-[0.95rem] sm:leading-relaxed">
            {t('login.branding.supporting')}
          </p>
        </div>
      </div>
    </aside>
  )
}
