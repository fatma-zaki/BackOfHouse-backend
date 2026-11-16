import { Search } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/app/providers/session'
import { cn } from '@/lib/utils'
import { navigationFor, type AdminNavItem } from './admin-navigation'

const MAX_RESULTS = 8

type SearchHit = {
  key: string
  label: string
  path: string
  Icon: AdminNavItem['icon']
}

/** Topbar search across admin nav pages (demo — not a backend search API). */
export function AdminGlobalSearch() {
  const { t } = useTranslation()
  const { role } = useSession()
  const navigate = useNavigate()
  const searchId = useId()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const index = useMemo<SearchHit[]>(
    () =>
      navigationFor(role).flatMap((section) =>
        section.items.map((item) => ({
          key: item.key,
          label: t(item.labelKey),
          path: item.path,
          Icon: item.icon,
        })),
      ),
    [role, t],
  )

  const q = query.trim().toLowerCase()
  const results = q
    ? index
        .filter((item) => item.label.toLowerCase().includes(q))
        .slice(0, MAX_RESULTS)
    : []

  const go = (hit: SearchHit) => {
    navigate(hit.path)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative min-w-0 w-[380px] max-md:flex-1 max-sm:hidden">
      <label
        htmlFor={searchId}
        className={cn(
          'box-border flex h-10 items-center gap-2.5 rounded-full border border-border bg-background px-3.5 text-muted-foreground',
          'focus-within:border-primary',
        )}
      >
        <Search className="size-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
        <input
          ref={inputRef}
          id={searchId}
          type="search"
          value={query}
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchPlaceholder')}
          aria-expanded={open && results.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((prev) => Math.max(prev - 1, 0))
            } else if (event.key === 'Enter' && results[active]) {
              event.preventDefault()
              go(results[active])
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setQuery('')
            }
          }}
        />
      </label>

      {open && q ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 flex flex-col gap-0.5 rounded-lg border border-border bg-popover p-1.5 shadow-md"
        >
          {results.length === 0 ? (
            <span className="px-3 py-3 text-[13px] text-muted-foreground">
              {t('header.noSearchResults', { q: query.trim() })}
            </span>
          ) : (
            results.map((hit, index) => {
              const Icon = hit.Icon
              const isActive = index === active

              return (
                <button
                  key={hit.key}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-muted-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit)}
                >
                  <Icon className="size-4 shrink-0 stroke-[1.8]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                    {hit.label}
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
                    {t('header.searchGroupPages')}
                  </span>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
