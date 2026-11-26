import i18n from 'i18next'
import { useEffect, type ReactNode } from 'react'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import arCommon from '@/locales/ar/common.json'
import enCommon from '@/locales/en/common.json'

/** Must match the pre-paint script in `index.html`. Independent of the theme storage key. */
const LANGUAGE_STORAGE_KEY = 'language'
const DEFAULT_LANGUAGE = 'en' as const

type AppLanguage = 'en' | 'ar'

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE
  const normalized = value.toLowerCase()
  if (normalized === 'ar' || normalized.startsWith('ar-') || normalized.startsWith('ar_')) {
    return 'ar'
  }
  if (normalized === 'en' || normalized.startsWith('en-') || normalized.startsWith('en_')) {
    return 'en'
  }
  return DEFAULT_LANGUAGE
}

function readStoredLanguage(): AppLanguage {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'ar') return stored
    // Absent or invalid → English (do not rewrite storage here)
    return DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function persistLanguage(language: string) {
  try {
    if (typeof localStorage === 'undefined') return
    const next = normalizeLanguage(language)
    if (localStorage.getItem(LANGUAGE_STORAGE_KEY) === next) return
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  } catch {
    // Storage may be unavailable (private mode, quotas, policies).
  }
}

function resolveDocumentLocale(language: string): {
  lang: AppLanguage
  dir: 'rtl' | 'ltr'
} {
  const lang = normalizeLanguage(language)
  return lang === 'ar'
    ? { lang: 'ar', dir: 'rtl' }
    : { lang: 'en', dir: 'ltr' }
}

function syncDocumentLocale(language: string) {
  if (typeof document === 'undefined') return
  const { lang, dir } = resolveDocumentLocale(language)
  const root = document.documentElement
  if (root.lang !== lang) root.lang = lang
  if (root.dir !== dir) root.dir = dir
}

const initialLanguage = readStoredLanguage()

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    ar: { common: arCommon },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ['en', 'ar'],
  nonExplicitSupportedLngs: true,
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
})

// Align document locale as soon as this module loads (before language-dependent UI paints).
syncDocumentLocale(initialLanguage)

type I18nProviderProps = {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Re-sync after mount; persist only on real language changes (not initial load).
    syncDocumentLocale(i18n.resolvedLanguage ?? i18n.language)

    const onLanguageChanged = (language: string) => {
      syncDocumentLocale(language)
      persistLanguage(language)
    }

    i18n.on('languageChanged', onLanguageChanged)

    return () => {
      i18n.off('languageChanged', onLanguageChanged)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
