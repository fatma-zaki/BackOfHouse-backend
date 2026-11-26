import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  IMPORT_TEMPLATE_IDS,
  type ImportTemplateId,
} from '@/features/claims-imports/types/claims-imports.types'

export function ClaimsImportsImportDataCard() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = (file: File | undefined) => {
    if (!file) return
    toast.message(
      t('claimsImports.toasts.fileReceived', { filename: file.name }),
    )
  }

  const downloadTemplate = (templateId: ImportTemplateId) => {
    toast.message(t(`claimsImports.toasts.template.${templateId}`))
  }

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">
          {t('claimsImports.importData.title')}
        </CardTitle>
        <CardDescription className="sr-only">
          {t('claimsImports.importData.dropzoneHint')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            onFileSelected(file)
            event.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={openFilePicker}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors',
            'hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <Upload className="size-8 text-primary" aria-hidden="true" />
          <span className="text-sm font-bold text-foreground">
            {t('claimsImports.importData.dropzoneTitle')}
          </span>
          <span className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            {t('claimsImports.importData.dropzoneHint')}
          </span>
        </button>

        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">
            {t('claimsImports.importData.templatesLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {IMPORT_TEMPLATE_IDS.map((templateId) => (
              <Button
                key={templateId}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-primary/50 bg-transparent px-3 text-xs font-bold text-primary shadow-none hover:bg-primary/5 hover:text-primary"
                onClick={() => downloadTemplate(templateId)}
              >
                <Download data-icon="inline-start" className="size-3.5" />
                {t(`claimsImports.importData.templates.${templateId}`)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
