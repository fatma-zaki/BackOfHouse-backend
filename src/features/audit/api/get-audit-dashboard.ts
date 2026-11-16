/**
 * Local async adapter over Audit log mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 *
 * Demo rows use `whenKey` prefixes like `sep28_1042` (month + day). Entries are
 * filtered against the requested range when that prefix can be parsed; otherwise
 * they are kept. Year is assumed 2026 to match the mock demo month.
 */

import { AUDIT_MOCK_DASHBOARD } from '@/features/audit/mocks/audit-dashboard.mock'
import type {
  AuditDashboardData,
  AuditDateRangeKey,
  AuditRow,
} from '@/features/audit/types/audit.types'

const MOCK_LATENCY_MS = 160

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

const DEMO_YEAR = 2026

export function toAuditDateRangeKey(range: {
  from: Date
  to: Date
}): AuditDateRangeKey {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}

function parseAuditWhenKey(whenKey: string): Date | null {
  const match = /^([a-z]{3})(\d{1,2})_/i.exec(whenKey)
  if (!match) return null
  const month = MONTH_INDEX[match[1].toLowerCase()]
  const day = Number(match[2])
  if (month === undefined || !Number.isFinite(day) || day < 1) return null
  return new Date(DEMO_YEAR, month, day)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  )
}

function filterEntriesByRange(
  entries: readonly AuditRow[],
  range: { from: Date; to: Date },
): AuditRow[] {
  const from = startOfLocalDay(range.from)
  const to = endOfLocalDay(range.to)

  return entries.filter((entry) => {
    const occurred = parseAuditWhenKey(entry.whenKey)
    if (!occurred) return true
    return occurred >= from && occurred <= to
  })
}

export async function getAuditDashboard(params: {
  range: { from: Date; to: Date }
}): Promise<AuditDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  const rangeKey = toAuditDateRangeKey(params.range)
  const entries = filterEntriesByRange(
    AUDIT_MOCK_DASHBOARD.entries,
    params.range,
  ).map((row) => ({ ...row }))

  return {
    range: rangeKey,
    entries,
    totalCount: entries.length,
  }
}
