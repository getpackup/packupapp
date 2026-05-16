import { toast } from 'sonner'

import { Switch } from '~/components/ui/switch'
import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateUser } from '~/services/users'

export function FriendRequestEmailToggle() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')

  if (isAnonymous) {
    return null
  }

  const enabled = user?.preferences?.friendRequestEmailEnabled !== false

  const handleToggle = () => {
    const newValue = !enabled
    updateUserAsync({
      data: { preferences: { friendRequestEmailEnabled: newValue } },
    })
    toast.success(
      newValue
        ? 'You will now receive friend request emails'
        : 'You will no longer receive friend request emails'
    )
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} />
}
