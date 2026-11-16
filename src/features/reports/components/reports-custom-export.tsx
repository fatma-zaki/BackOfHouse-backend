import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReportsChoiceChip } from '@/features/reports/components/reports-choice-chip'
import { ReportsFormatTabs } from '@/features/reports/components/reports-format-tabs'
import type {
  ExportColumnId,
  ExportFilterField,
  ExportFilterFieldId,
  ExportFormatTab,
} from '@/features/reports/types/reports.types'

type ReportsCustomExportProps = {
  isLoading?: boolean
  filters: readonly ExportFilterField[]
  builder: Record<ExportFilterFieldId, string>
  onBuilderChange: (id: ExportFilterFieldId, value: string) => void
  standardColumns: readonly ExportColumnId[]
  contactColumns: readonly ExportColumnId[]
  selectedColumns: ReadonlySet<ExportColumnId>
  onToggleColumn: (id: ExportColumnId) => void
  canExportContacts: boolean
  format: ExportFormatTab
  onFormatChange: (format: ExportFormatTab) => void
  schedules: readonly string[]
  onGenerate: () => void
  onSchedule: (scheduleId: string) => void
}

export function ReportsCustomExport({
  isLoading = false,
  filters,
  builder,
  onBuilderChange,
  standardColumns,
  contactColumns,
  selectedColumns,
  onToggleColumn,
  canExportContacts,
  format,
  onFormatChange,
  schedules,
  onGenerate,
  onSchedule,
}: ReportsCustomExportProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[15px] font-bold">
          {t('reports.builder.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <FormSkeleton
            fields={4}
            lastFieldTall={false}
            label={t('reports.states.loading')}
          />
        ) : (
          <>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filters.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <Label
                htmlFor={`reports-filter-${field.id}`}
                className="text-xs font-bold text-muted-foreground"
              >
                {t(`reports.builder.fields.${field.id}`)}
              </Label>
              <Select
                value={builder[field.id]}
                onValueChange={(value) => onBuilderChange(field.id, value)}
              >
                <SelectTrigger
                  id={`reports-filter-${field.id}`}
                  className="h-9 w-full rounded-lg shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`reports.builder.options.${field.id}.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-muted-foreground">
            {t('reports.builder.columnsLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {standardColumns.map((columnId) => (
              <ReportsChoiceChip
                key={columnId}
                label={t(`reports.builder.columns.${columnId}`)}
                selected={selectedColumns.has(columnId)}
                onToggle={() => onToggleColumn(columnId)}
              />
            ))}
            {contactColumns.map((columnId) => (
              <ReportsChoiceChip
                key={columnId}
                label={t(`reports.builder.columns.${columnId}`)}
                selected={selectedColumns.has(columnId)}
                locked={!canExportContacts}
                lockedNote={t('reports.builder.locked')}
                onToggle={() => onToggleColumn(columnId)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-muted-foreground">
            {t('reports.builder.formatLabel')}
          </p>
          <ReportsFormatTabs value={format} onChange={onFormatChange} />
        </div>

        <div
          role="note"
          className="rounded-xl border border-info/20 bg-info/10 px-3 py-2.5 text-xs leading-relaxed text-foreground"
        >
          {canExportContacts
            ? t('reports.builder.callout.superAdmin')
            : t('reports.builder.callout.restricted')}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-9 min-w-[10rem] flex-1 rounded-full px-4 font-medium"
            onClick={onGenerate}
          >
            {t('reports.builder.generate')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-primary px-4 font-medium text-primary hover:bg-primary/5 hover:text-primary"
              >
                {t('reports.builder.schedule')}
                <ChevronDown data-icon="inline-end" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {schedules.map((scheduleId) => (
                <DropdownMenuItem
                  key={scheduleId}
                  onClick={() => onSchedule(scheduleId)}
                >
                  {t(`reports.schedules.${scheduleId}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
