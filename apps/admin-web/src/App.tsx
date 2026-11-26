import { router } from '@/app/router'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { SessionProvider } from '@/app/providers/SessionProvider'
import { StoreProvider } from '@/app/providers/StoreProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RouterProvider } from 'react-router-dom'

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <StoreProvider>
          <QueryProvider>
            <SessionProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
                <Toaster />
              </TooltipProvider>
            </SessionProvider>
          </QueryProvider>
        </StoreProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
