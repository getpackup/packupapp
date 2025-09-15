import { useCallback, useEffect, useState } from 'react'

const SOUNDS_PREFERENCE_KEY = 'packup-sounds-enabled'

export function useSoundsPreference() {
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true

    const stored = localStorage.getItem(SOUNDS_PREFERENCE_KEY)
    return stored ? JSON.parse(stored) : true
  })

  const toggleSounds = useCallback(() => {
    const newValue = !soundsEnabled
    setSoundsEnabled(newValue)
    localStorage.setItem(SOUNDS_PREFERENCE_KEY, JSON.stringify(newValue))
  }, [soundsEnabled])

  useEffect(() => {
    localStorage.setItem(SOUNDS_PREFERENCE_KEY, JSON.stringify(soundsEnabled))
  }, [soundsEnabled])

  return { soundsEnabled, toggleSounds }
}