import { toast } from 'sonner'

import { Switch } from '~/components/ui/switch'
import { useAuth } from '~/contexts/auth/useAuth'
import { registerFcmToken, requestNotificationPermissionForFcm } from '~/lib/fcmToken'
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

  const handleToggle = async () => {
    const newValue = !enabled

    if (newValue) {
      const permission = await requestNotificationPermissionForFcm()
      if (permission !== 'granted') {
        toast.error('Please allow notifications in your browser to enable chat alerts')
        return
      }
    }

    await updateUserAsync({
      data: { preferences: { chatNotificationsEnabled: newValue } },
    })

    if (newValue && user?.uid) {
      await registerFcmToken(user.uid)
    }

    toast.success(newValue ? 'Chat notifications enabled' : 'Chat notifications disabled')
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} />
}
