import { toast } from 'sonner'

import { Switch } from '~/components/ui/switch'
import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateUser } from '~/services/users'

export function ChatNotificationsToggle() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')

  if (isAnonymous) {
    return null
  }

  const enabled = user?.preferences?.chatNotificationsEnabled !== false

  const handleToggle = () => {
    const newValue = !enabled
    updateUserAsync({
      data: { preferences: { chatNotificationsEnabled: newValue } },
    })
    toast.success(
      newValue ? 'Chat notifications enabled' : 'Chat notifications disabled'
    )
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} />
}
