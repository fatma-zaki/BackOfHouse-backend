import { useQuery } from '@tanstack/react-query'
import { getUserDetail } from '@/features/users/api/get-user-detail'
import { usersKeys } from '@/features/users/query-keys'

type UseUserDetailParams = {
  userId: string
  enabled?: boolean
}

export function useUserDetail({ userId, enabled = true }: UseUserDetailParams) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => getUserDetail(userId),
    enabled: enabled && Boolean(userId),
  })
}
