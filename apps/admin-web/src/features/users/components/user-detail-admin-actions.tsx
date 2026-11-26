import {
  Ban,
  ChevronRight,
  Download,
  KeyRound,
  Pencil,
  ShieldOff,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserAdminActionId } from '@/features/users/types/users.types'

const ACTIONS: readonly {
  id: UserAdminActionId
  icon: typeof Pencil
  destructive?: boolean
}[] = [
  { id: 'adjustPoints', icon: Pencil },
  { id: 'resetPassword', icon: KeyRound },
  { id: 'removeVerification', icon: ShieldOff },
  { id: 'dataRequest', icon: Download },
  { id: 'suspendAccount', icon: Ban, destructive: true },
]

type UserDetailAdminActionsProps = {
  userName: string
}

export function UserDetailAdminActions({
  userName,
}: UserDetailAdminActionsProps) {
  const { t } = useTranslation()
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [removeVerificationOpen, setRemoveVerificationOpen] = useState(false)

  const handleAction = (id: UserAdminActionId) => {
    if (id === 'suspendAccount') {
      setSuspendOpen(true)
      return
    }
    if (id === 'removeVerification') {
      setRemoveVerificationOpen(true)
      return
    }
    toast.message(t(`users.toasts.admin.${id}`))
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2 sm:px-5">
          <CardTitle className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {t('users.detail.adminActionsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-3">
          <ul className="flex flex-col">
            {ACTIONS.map(({ id, icon: Icon, destructive }) => (
              <li key={id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-colors hover:bg-muted/70',
                    destructive
                      ? 'text-destructive hover:bg-destructive/5'
                      : 'text-foreground',
                  )}
                  onClick={() => handleAction(id)}
                >
                  <Icon className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="flex-1">{t(`users.adminActions.${id}`)}</span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={t('users.dialogs.suspend.title', { name: userName })}
        description={t('users.dialogs.suspend.description')}
        confirmLabel={t('users.adminActions.suspendAccount')}
        destructive
        onConfirm={() => {
          toast.message(t('users.toasts.admin.suspendAccount'))
          setSuspendOpen(false)
        }}
      />

      <ConfirmDialog
        open={removeVerificationOpen}
        onOpenChange={setRemoveVerificationOpen}
        title={t('users.dialogs.removeVerification.title', { name: userName })}
        description={t('users.dialogs.removeVerification.description')}
        confirmLabel={t('users.adminActions.removeVerification')}
        destructive
        onConfirm={() => {
          toast.message(t('users.toasts.admin.removeVerification'))
          setRemoveVerificationOpen(false)
        }}
      />
    </>
  )
}
