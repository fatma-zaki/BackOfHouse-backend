import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ListingSubmission } from '@/features/listings/types/listings.types'

type ListingsRequestChangesDialogProps = {
  open: boolean
  listing: ListingSubmission | null
  message: string
  onMessageChange: (value: string) => void
  reasons: readonly string[]
  selectedReasons: ReadonlySet<string>
  onToggleReason: (reason: string) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ListingsRequestChangesDialog({
  open,
  listing,
  message,
  onMessageChange,
  reasons,
  selectedReasons,
  onToggleReason,
  onOpenChange,
  onConfirm,
}: ListingsRequestChangesDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        closeLabel={t('listings.dialogs.close')}
      >
        <DialogHeader>
          <DialogTitle>{t('listings.dialogs.requestChanges.title')}</DialogTitle>
          <DialogDescription>
            {listing
              ? t('listings.dialogs.requestChanges.subtitle', {
                  title: t(`listings.items.${listing.titleKey}`),
                })
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">
              {t('listings.dialogs.requestChanges.reasons')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {reasons.map((reason) => {
                const selected = selectedReasons.has(reason)
                return (
                  <button
                    key={reason}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleReason(reason)}
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-bold',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span aria-hidden="true">{selected ? '✓' : '+'}</span>
                    {t(`listings.changeReasons.${reason}`)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="listings-change-message"
              className="text-xs font-bold text-muted-foreground"
            >
              {t('listings.dialogs.requestChanges.message')}
            </Label>
            <Textarea
              id="listings-change-message"
              rows={5}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('listings.dialogs.close')}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t('listings.dialogs.requestChanges.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
