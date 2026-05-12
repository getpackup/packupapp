import { toast } from 'sonner'

import { Switch } from '~/components/ui/switch'
import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateUser } from '~/services/users'

export function SafetyItineraryToggle() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')

  if (isAnonymous) {
    return null
  }

  const enabled = user?.preferences?.safetyItineraryEnabled !== false

  const handleToggle = () => {
    const newValue = !enabled
    updateUserAsync({
      data: { preferences: { safetyItineraryEnabled: newValue } },
    })
    toast.success(
      newValue
        ? 'You will now receive Safety Itinerary emails the day before a trip'
        : 'You will no longer receive Safety Itinerary emails'
    )
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} />
}
