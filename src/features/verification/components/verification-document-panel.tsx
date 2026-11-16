import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { VerificationDocument } from '@/features/verification/types/verification.types'

type VerificationDocumentPanelProps = {
  documents: readonly VerificationDocument[]
  selectedDocumentId: string
  onSelectDocument: (id: string) => void
}

function DocumentPreviewPlaceholder() {
  return (
    <div
      className="flex min-h-[14rem] flex-col gap-2 rounded-xl border border-border bg-muted/50 p-4"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-2 w-16 rounded-full bg-muted-foreground/20" />
        <div className="size-6 rounded-full bg-muted-foreground/15" />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {['w-full', 'w-[92%]', 'w-full', 'w-[78%]', 'w-[88%]', 'w-[65%]'].map(
          (widthClass, index) => (
            <div
              key={index}
              className={cn('h-2 rounded-full bg-muted-foreground/15', widthClass)}
            />
          ),
        )}
      </div>
    </div>
  )
}

export function VerificationDocumentPanel({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: VerificationDocumentPanelProps) {
  const { t } = useTranslation()

  const selected =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0]

  if (!selected) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {t('verification.documents.sectionTitle')}
      </p>

      <DocumentPreviewPlaceholder />

      <p className="text-center text-[11px] text-muted-foreground">
        {t('verification.documents.previewPlaceholder')}
      </p>
      <p className="text-center text-[11px] text-muted-foreground">
        {t(`verification.documents.captions.${selected.previewCaptionKey}`)}
      </p>

      <ul className="flex flex-col gap-2">
        {documents.map((doc) => {
          const active = doc.id === selected.id
          return (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onSelectDocument(doc.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start text-[13px] transition-colors',
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/40',
                )}
              >
                <span className="min-w-0 truncate font-bold text-foreground">
                  {t(`verification.documents.files.${doc.fileNameKey}`)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t(`verification.documents.sizes.${doc.sizeKey}`)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
