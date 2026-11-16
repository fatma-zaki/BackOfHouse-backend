import { useParams } from 'react-router-dom'
import { UserDetailView } from '@/features/users/components/user-detail-view'

/**
 * Route-level User detail composition. Feature logic lives under `features/users`.
 */
export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  return <UserDetailView userId={userId ?? ''} />
}
