import { useMemo } from 'react'
import useSound from 'use-sound'

/**
 * Shared hook for checkbox item sounds.
 * Loads sounds once and returns reusable play functions.
 */
export const useCheckboxSounds = () => {
  const [playActive] = useSound('/sounds/pop-down.mp3', {
    volume: 0.1,
  })
  const [playOn] = useSound('/sounds/pop-up-on.mp3', {
    volume: 0.1,
  })
  const [playOff] = useSound('/sounds/pop-up-off.mp3', {
    volume: 0.1,
  })

  return useMemo(
    () => ({
      playActive,
      playOn,
      playOff,
    }),
    [playActive, playOn, playOff]
  )
}
