import { toast } from 'sonner'

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

  return (
    <button
      role="switch"
      type="button"
      aria-checked={enabled}
      aria-label="Toggle Safety Itinerary"
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? 'bg-primary' : 'bg-input'}`}
    >
      <span
        className={`pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
