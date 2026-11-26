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
import type { ListingSubmission } from '@/features/listings/types/listings.types'

type ListingsApprovedDialogProps = {
  open: boolean
  listing: ListingSubmission | null
  nextListing: ListingSubmission | null
  onOpenChange: (open: boolean) => void
  onReviewNext: () => void
}

export function ListingsApprovedDialog({
  open,
  listing,
  nextListing,
  onOpenChange,
  onReviewNext,
}: ListingsApprovedDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        closeLabel={t('listings.dialogs.close')}
      >
        <DialogHeader>
          <DialogTitle>{t('listings.dialogs.approved.title')}</DialogTitle>
          <DialogDescription>
            {listing
              ? t('listings.dialogs.approved.subtitle', {
                  title: t(`listings.items.${listing.titleKey}`),
                })
              : null}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('listings.dialogs.close')}
          </Button>
          {nextListing ? (
            <Button type="button" onClick={onReviewNext}>
              {t('listings.dialogs.approved.reviewNext')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
