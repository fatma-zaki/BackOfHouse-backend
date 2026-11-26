import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Globe, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { toggleMobileSidebar } from '@/store/slices/ui.slice'
import { AdminGlassIconButton } from './admin-glass-icon-button'
import { AdminGlobalSearch } from './admin-global-search'
import { AdminNotifications } from './admin-notifications'
import { AdminUserMenu } from './admin-user-menu'

export function AdminHeader() {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const reduceMotion = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()
  const themeReady = resolvedTheme !== undefined
  const isDark = resolvedTheme === 'dark'
  const isArabic = (i18n.resolvedLanguage ?? i18n.language)
    .toLowerCase()
    .startsWith('ar')
  const [globeSpin, setGlobeSpin] = useState(0)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const toggleLanguage = () => {
    setGlobeSpin((prev) => prev + 1)
    void i18n.changeLanguage(isArabic ? 'en' : 'ar')
  }

  return (
    <header className="sticky top-0 z-40 box-border flex h-[var(--topbar-h)] shrink-0 items-center gap-3 border-b border-border bg-card px-[var(--page-px)]">
      <button
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
        aria-label={t('header.openMenu')}
        onClick={() => dispatch(toggleMobileSidebar())}
      >
        <Menu className="size-5 stroke-[1.8]" aria-hidden="true" />
      </button>

      <AdminGlobalSearch />

      <span className="flex-1" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-2.5">
        <AdminGlassIconButton
          disabled={!themeReady}
          aria-label={t('theme.label')}
          title={t('theme.label')}
          onClick={toggleTheme}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              className="inline-flex"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, rotate: -70, scale: 0.55 }
              }
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, rotate: 70, scale: 0.55 }
              }
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {isDark ? (
                <Sun className="size-[19px] stroke-[1.8]" aria-hidden="true" />
              ) : (
                <Moon
                  className="size-[19px] fill-current stroke-[1.8]"
                  aria-hidden="true"
                />
              )}
            </motion.span>
          </AnimatePresence>
        </AdminGlassIconButton>

        <AdminGlassIconButton
          aria-label={t('shell.languageLabel')}
          title={t('shell.languageLabel')}
          onClick={toggleLanguage}
        >
          <motion.span
            className="inline-flex"
            animate={
              reduceMotion ? undefined : { rotate: globeSpin * 360 }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Globe className="size-[19px] stroke-[1.8]" aria-hidden="true" />
          </motion.span>
        </AdminGlassIconButton>

        <AdminNotifications />
      </div>

      <AdminUserMenu />
    </header>
  )
}
