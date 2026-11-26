import { useQuery } from '@tanstack/react-query'
import {
  getAnalystHome,
  getMyDesk,
  getMyQueue,
  getMyTickets,
} from '@/features/my-work/api/get-my-work'
import { myWorkKeys } from '@/features/my-work/query-keys'

type EnabledParam = { enabled?: boolean }

export function useMyQueue({ enabled = true }: EnabledParam = {}) {
  return useQuery({
    queryKey: myWorkKeys.myQueue(),
    queryFn: () => getMyQueue(),
    enabled,
  })
}

export function useMyDesk({ enabled = true }: EnabledParam = {}) {
  return useQuery({
    queryKey: myWorkKeys.myDesk(),
    queryFn: () => getMyDesk(),
    enabled,
  })
}

export function useMyTickets({ enabled = true }: EnabledParam = {}) {
  return useQuery({
    queryKey: myWorkKeys.myTickets(),
    queryFn: () => getMyTickets(),
    enabled,
  })
}

export function useAnalystHome({ enabled = true }: EnabledParam = {}) {
  return useQuery({
    queryKey: myWorkKeys.analystHome(),
    queryFn: () => getAnalystHome(),
    enabled,
  })
}
