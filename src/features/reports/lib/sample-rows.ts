/**
 * DEMO sample rows for client CSV downloads until a real export API exists.
 */

import type { ReportId } from '@/features/reports/types/reports.types'

type SampleRow = Record<string, string | number>

const SAMPLE_BY_REPORT: Partial<Record<ReportId, SampleRow[]>> = {
  applications: [
    {
      applicant: 'Fatma Zaki',
      listing: 'Event Coordinator',
      company: 'Riyadh Season',
      status: 'Submitted',
      applied_on: '2026-09-12',
      city: 'Riyadh',
      email: 'fatma@example.com',
      phone: '+966500000001',
    },
    {
      applicant: 'Omar Nasser',
      listing: 'Stage Manager',
      company: 'Saudi Events Group',
      status: 'Shortlisted',
      applied_on: '2026-09-14',
      city: 'Jeddah',
      email: 'omar@example.com',
      phone: '+966500000002',
    },
  ],
  usersMembers: [
    {
      name: 'Nora Al-Qahtani',
      type: 'Individual',
      city: 'Riyadh',
      points: 240,
      verification: 'Verified',
      joined: '2026-03-01',
    },
  ],
  companies: [
    {
      company: 'Saudi Events Group',
      city: 'Riyadh',
      live_listings: 12,
      applications: 340,
      response_rate: '86%',
    },
  ],
  listings: [
    {
      listing: 'Event Coordinator',
      company: 'Riyadh Season',
      type: 'Job',
      city: 'Riyadh',
      status: 'Live',
    },
  ],
}

export function sampleRowsForReport(reportId: ReportId): SampleRow[] {
  return (
    SAMPLE_BY_REPORT[reportId] ?? [
      {
        report: reportId,
        note: 'Sample file — the API will generate the full report.',
      },
    ]
  )
}

export function stripContactColumns(rows: SampleRow[]): SampleRow[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([key]) => !/email|phone/i.test(key)),
    ),
  )
}
