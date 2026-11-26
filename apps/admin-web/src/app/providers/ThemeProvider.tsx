import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import type { ReactNode } from 'react'

type AppThemeProviderProps = {
  children: ReactNode
} & Omit<ThemeProviderProps, 'children'>

/**
 * Class-based theme provider for the existing `.dark` CSS tokens.
 * Persistence and system preference follow next-themes defaults/options.
 */
export function ThemeProvider({ children, ...props }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="theme"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
