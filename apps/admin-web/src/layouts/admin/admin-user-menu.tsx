import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/app/providers/session'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clearMockSession } from '@/features/auth/lib/mock-auth'
import {
  ROLE_HOME,
  ROLE_USER,
  ROLES,
  type Role,
} from '@/features/auth/lib/roles'

/** Profile chip with demo role switcher and sign-out. Not production auth. */
export function AdminUserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role, user, setRole } = useSession()

  const signOut = () => {
    clearMockSession()
    navigate('/login', { replace: true })
  }

  const switchRole = (next: string) => {
    const nextRole = next as Role
    setRole(nextRole)
    navigate(ROLE_HOME[nextRole], { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 border-0 bg-transparent p-0 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('header.userMenu')}
        >
          <Avatar size="default" className="size-9 bg-primary">
            <AvatarFallback className="bg-primary text-[13px] font-bold text-primary-foreground">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col leading-[1.25] sm:flex">
            <span className="truncate text-[13px] font-bold text-foreground">
              {t(`team.admins.names.${user.nameKey}`)}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {t(`team.roles.${role}`)}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-xl border-border p-2 shadow-lg"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
          {t('header.switchRoleDemo')}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={role} onValueChange={switchRole}>
          {ROLES.map((r) => {
            const demoUser = ROLE_USER[r]
            return (
              <DropdownMenuRadioItem
                key={r}
                value={r}
                className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium"
              >
                <Avatar size="sm" className="size-6 shrink-0 bg-muted">
                  <AvatarFallback className="bg-muted text-[10px] font-bold text-foreground">
                    {demoUser.initials}
                  </AvatarFallback>
                </Avatar>
                <span>{t(`team.roles.${r}`)}</span>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-bold"
          onClick={signOut}
        >
          <LogOut className="size-4 stroke-[1.8]" aria-hidden="true" />
          <span>{t('header.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
