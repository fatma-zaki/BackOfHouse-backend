import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { BRAND_LOGO_LIGHT_SRC, BRAND_LOGO_SRC } from '@/constants/brand'
import { cn } from '@/lib/utils'

type AdminLogoProps = {
  height?: number
  className?: string
  /** Force the light-on-dark wordmark regardless of theme. */
  onDark?: boolean
}

/**
 * Brand wordmark for the admin shell.
 * Uses the provided SVG assets — never retyped.
 */
export function AdminLogo({
  height = 34,
  className,
  onDark = false,
}: AdminLogoProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const useDarkAsset = onDark || resolvedTheme === 'dark'
  const src = useDarkAsset ? BRAND_LOGO_SRC : BRAND_LOGO_LIGHT_SRC

  return (
    <img
      src={src}
      alt={t('appName')}
      className={cn('w-auto object-contain object-start', className)}
      style={{ height }}
    />
  )
}
