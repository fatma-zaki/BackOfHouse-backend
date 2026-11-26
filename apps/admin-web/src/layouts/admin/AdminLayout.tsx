import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { setMobileSidebarOpen } from '@/store/slices/ui.slice'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

/** Shell for signed-in admin screens: sidebar · topbar · scrolling page. */
export function AdminLayout() {
  const { pathname } = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
    dispatch(setMobileSidebarOpen(false))
  }, [dispatch, pathname])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />

        <main className="flex w-full max-w-[1600px] flex-1 flex-col gap-[var(--gap)] px-[var(--page-px)] pt-[22px] pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
