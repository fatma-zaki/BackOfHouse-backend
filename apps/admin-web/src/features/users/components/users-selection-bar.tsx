import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UsersSelectionBarProps = {
  count: number
  onClear?: () => void
  className?: string
}

export function UsersSelectionBar({
  count,
  onClear,
  className,
}: UsersSelectionBarProps) {
  const { t } = useTranslation()
  const [suspendOpen, setSuspendOpen] = useState(false)

  if (count <= 0) return null

  const toastAction = (key: string) => {
    toast.message(t(key))
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-xl bg-primary/10 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <p className="text-sm font-bold text-primary">
          {t('users.selection.count', { count })}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 rounded-full bg-card px-3 text-xs font-bold shadow-none"
            onClick={() => toastAction('users.toasts.sendMessage')}
          >
            {t('users.selection.sendMessage')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 rounded-full bg-card px-3 text-xs font-bold shadow-none"
            onClick={() => toastAction('users.toasts.addTag')}
          >
            {t('users.selection.addTag')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-bold shadow-none"
            onClick={() => toastAction('users.toasts.exportSelected')}
          >
            {t('users.selection.exportSelected')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-destructive/40 px-3 text-xs font-bold text-destructive shadow-none hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setSuspendOpen(true)}
          >
            {t('users.selection.suspend')}
          </Button>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-bold shadow-none"
              onClick={onClear}
            >
              {t('users.selection.clear')}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={t('users.toasts.suspendConfirmTitle', { count })}
        description={t('users.toasts.suspendConfirmDescription')}
        confirmLabel={t('users.selection.suspend')}
        destructive
        onConfirm={() => {
          toast.message(t('users.toasts.suspendSelected'))
          setSuspendOpen(false)
        }}
      />
    </>
  )
}
