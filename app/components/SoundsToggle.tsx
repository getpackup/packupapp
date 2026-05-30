import { Volume2, VolumeX } from 'lucide-react'
import { type MouseEventHandler } from 'react'
import { animated } from 'react-spring'
import useSound from 'use-sound'

import onSound from '/sounds/switch-on.mp3'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useSoundsState } from '~/contexts/globalState'
import useBoop from '~/lib/useBoop'

export function SoundsToggle() {
  const { soundsEnabled, toggleSounds } = useSoundsState()

  const [switchOn] = useSound(onSound, {
    interrupt: true,
  })

  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10 })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <animated.button
          style={style}
          onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
          type="button"
          aria-label="Toggle sounds"
          onClick={() => {
            if (!soundsEnabled) {
              switchOn()
            }
            toggleSounds()
          }}
          className="rounded-md p-1 focus:bg-gray-100 focus:outline-none md:first-letter:p-2 dark:focus:bg-gray-800"
        >
          {soundsEnabled ? <Volume2 /> : <VolumeX />}
        </animated.button>
      </TooltipTrigger>
      <TooltipContent>Toggle sounds</TooltipContent>
    </Tooltip>
  )
}
