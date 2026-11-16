import { useQuery } from '@tanstack/react-query'
import { getSupportInbox } from '@/features/support/api/get-support-inbox'
import { supportKeys } from '@/features/support/query-keys'

export function useSupportInbox(enabled = true) {
  return useQuery({
    queryKey: supportKeys.inbox(),
    queryFn: () => getSupportInbox(),
    enabled,
  })
}
