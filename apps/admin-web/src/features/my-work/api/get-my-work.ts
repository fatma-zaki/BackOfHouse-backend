/**
 * Local async adapters over My Work mock data.
 * No REST endpoints and no Axios — swap these when a real API exists.
 */

import {
  ANALYST_HOME_MOCK,
  MY_DESK_MOCK,
  MY_QUEUE_MOCK,
  MY_TICKETS_MOCK,
} from '@/features/my-work/mocks/my-work.mock'
import type {
  AnalystHomeData,
  MyDeskData,
  MyQueueData,
  MyTicketsData,
} from '@/features/my-work/types/my-work.types'

const MOCK_LATENCY_MS = 140

async function delay(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

export async function getMyQueue(): Promise<MyQueueData> {
  await delay()
  return {
    kpis: MY_QUEUE_MOCK.kpis.map((row) => ({ ...row })),
    upNext: MY_QUEUE_MOCK.upNext.map((row) => ({ ...row })),
    guidelines: MY_QUEUE_MOCK.guidelines.map((row) => ({ ...row })),
    recentDecisions: MY_QUEUE_MOCK.recentDecisions.map((row) => ({ ...row })),
  }
}

export async function getMyDesk(): Promise<MyDeskData> {
  await delay()
  return {
    kpis: MY_DESK_MOCK.kpis.map((row) => ({ ...row })),
    week: MY_DESK_MOCK.week.map((day) => ({
      ...day,
      items: day.items.map((item) => ({ ...item })),
    })),
    drafts: MY_DESK_MOCK.drafts.map((row) => ({ ...row })),
    mostRead: MY_DESK_MOCK.mostRead.map((row) => ({ ...row })),
  }
}

export async function getMyTickets(): Promise<MyTicketsData> {
  await delay()
  return {
    kpis: MY_TICKETS_MOCK.kpis.map((row) => ({ ...row })),
    tickets: MY_TICKETS_MOCK.tickets.map((row) => ({ ...row })),
    capabilities: MY_TICKETS_MOCK.capabilities.map((row) => ({ ...row })),
    byTopic: MY_TICKETS_MOCK.byTopic.map((row) => ({ ...row })),
  }
}

export async function getAnalystHome(): Promise<AnalystHomeData> {
  await delay()
  return {
    kpis: ANALYST_HOME_MOCK.kpis.map((row) => ({ ...row })),
    savedReports: ANALYST_HOME_MOCK.savedReports.map((row) => ({
      ...row,
      formats: [...row.formats],
    })),
    applicationsPerWeek: ANALYST_HOME_MOCK.applicationsPerWeek.map((row) => ({
      ...row,
    })),
    dataAccess: ANALYST_HOME_MOCK.dataAccess.map((row) => ({ ...row })),
  }
}
