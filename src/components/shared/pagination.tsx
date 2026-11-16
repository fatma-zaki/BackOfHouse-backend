import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ELLIPSIS = 'ellipsis' as const

type PageItem = number | typeof ELLIPSIS

type PaginationPageSizeProps =
  | {
      pageSizeOptions: readonly number[]
      onPageSizeChange: (pageSize: number) => void
    }
  | {
      pageSizeOptions?: undefined
      onPageSizeChange?: undefined
    }

export type PaginationProps = {
  /** Current page (1-based). */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  /** Number of page buttons on each side of the current page. Defaults to 1. */
  siblingCount?: number
  disabled?: boolean
  className?: string
} & PaginationPageSizeProps

function range(start: number, end: number): number[] {
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function getPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PageItem[] {
  if (totalPages <= 0) return []

  const totalPageNumbers = siblingCount * 2 + 5

  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount
    return [...range(1, leftItemCount), ELLIPSIS, totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount
    return [1, ELLIPSIS, ...range(totalPages - rightItemCount + 1, totalPages)]
  }

  return [
    1,
    ELLIPSIS,
    ...range(leftSibling, rightSibling),
    ELLIPSIS,
    totalPages,
  ]
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  siblingCount = 1,
  disabled = false,
  className,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation()
  const pageSizeLabelId = useId()

  const safePageSize = Math.max(1, Math.floor(pageSize))
  const safeSiblingCount = Math.max(0, Math.floor(siblingCount))
  const totalPages =
    totalItems <= 0 ? 0 : Math.ceil(totalItems / safePageSize)

  // Clamp for display/navigation only — do not write back to the parent.
  const displayPage =
    totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages)

  const pageItems = useMemo(
    () => getPageItems(displayPage, totalPages, safeSiblingCount),
    [displayPage, totalPages, safeSiblingCount],
  )

  const from =
    totalItems === 0 ? 0 : (displayPage - 1) * safePageSize + 1
  const to =
    totalItems === 0 ? 0 : Math.min(displayPage * safePageSize, totalItems)

  const canGoPrevious = !disabled && totalPages > 0 && displayPage > 1
  const canGoNext = !disabled && totalPages > 0 && displayPage < totalPages

  const handlePrevious = () => {
    if (!canGoPrevious) return
    onPageChange(displayPage - 1)
  }

  const handleNext = () => {
    if (!canGoNext) return
    onPageChange(displayPage + 1)
  }

  const handlePageClick = (nextPage: number) => {
    if (disabled || nextPage === displayPage) return
    onPageChange(nextPage)
  }

  const handlePageSizeChange = (nextValue: string) => {
    if (!onPageSizeChange || disabled) return
    const nextSize = Number(nextValue)
    if (!Number.isFinite(nextSize) || nextSize <= 0) return
    onPageSizeChange(nextSize)
    // Reset via the documented page callback — no internal page state.
    if (page !== 1) {
      onPageChange(1)
    }
  }

  const showPageSizeSelect =
    Array.isArray(pageSizeOptions) &&
    pageSizeOptions.length > 0 &&
    typeof onPageSizeChange === 'function'

  // Keep Select value valid without mutating parent pageSize.
  // If the controlled pageSize is absent from options, expose it as a
  // disabled item so Radix always receives a matching value.
  const isPageSizeInOptions = Boolean(
    pageSizeOptions?.some((option) => option === safePageSize),
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {t('pagination.summary', { from, to, total: totalItems })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelect ? (
          <div className="flex items-center gap-2">
            <span
              id={pageSizeLabelId}
              className="text-sm text-muted-foreground"
            >
              {t('pagination.pageSize')}
            </span>
            <Select
              value={String(safePageSize)}
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger
                size="sm"
                aria-labelledby={pageSizeLabelId}
                className="min-w-16"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {!isPageSizeInOptions ? (
                  <SelectItem value={String(safePageSize)} disabled>
                    {safePageSize}
                  </SelectItem>
                ) : null}
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <nav aria-label={t('pagination.navLabel')}>
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!canGoPrevious}
                aria-label={t('pagination.previous')}
                onClick={handlePrevious}
              >
                <ChevronLeft
                  aria-hidden="true"
                  className="rtl:rotate-180"
                />
              </Button>
            </li>

            {pageItems.map((item, index) =>
              item === ELLIPSIS ? (
                <li
                  key={`ellipsis-${index}`}
                  className="flex size-7 items-center justify-center text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </li>
              ) : (
                <li key={item}>
                  <Button
                    type="button"
                    variant={item === displayPage ? 'default' : 'outline'}
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={t('pagination.page', { page: item })}
                    aria-current={item === displayPage ? 'page' : undefined}
                    onClick={() => handlePageClick(item)}
                  >
                    <span className="tabular-nums">{item}</span>
                  </Button>
                </li>
              ),
            )}

            <li>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!canGoNext}
                aria-label={t('pagination.next')}
                onClick={handleNext}
              >
                <ChevronRight
                  aria-hidden="true"
                  className="rtl:rotate-180"
                />
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
