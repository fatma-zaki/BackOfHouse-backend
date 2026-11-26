import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * Controlled confirmation dialog.
 *
 * Confirm does **not** close the dialog. After `onConfirm` runs — including
 * after any async work the parent performs — the parent must close by calling
 * `onOpenChange(false)`. Cancel/dismiss flows use the controlled
 * `open` / `onOpenChange` API; optional `onCancel` is only invoked from the
 * cancel control.
 */
export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /**
   * Invoked when confirmation is allowed. Does not change `open`;
   * the parent closes the dialog via `onOpenChange(false)`.
   */
  onConfirm: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  /** When true, the confirm control uses the destructive button variant. */
  destructive?: boolean
  /** Disables confirmation (also disabled while `isLoading`). */
  disabled?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  destructive = false,
  disabled = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const confirmDisabled = isLoading || disabled

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading && !nextOpen) return
    onOpenChange(nextOpen)
  }

  const handleCancelClick = () => {
    if (isLoading) return
    onCancel?.()
  }

  const handleConfirm = () => {
    if (confirmDisabled) return
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleCancelClick}>
            {cancelLabel ?? t('actions.cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={confirmDisabled}
            aria-busy={isLoading || undefined}
            onClick={handleConfirm}
          >
            {isLoading
              ? t('states.loading')
              : (confirmLabel ?? t('actions.confirm'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
