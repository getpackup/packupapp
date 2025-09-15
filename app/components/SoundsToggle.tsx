import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { type MouseEventHandler } from 'react'
import { animated } from 'react-spring'
import useSound from 'use-sound'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import useBoop from '~/lib/useBoop'
import { useSoundsPreference } from '~/lib/useSoundsPreference'

import offSound from '../../sounds/switch-off.mp3'
import onSound from '../../sounds/switch-on.mp3'

export function SoundsToggle() {
  const { soundsEnabled, toggleSounds } = useSoundsPreference()

  const [switchOn] = useSound(onSound, {
    interrupt: true,
    soundEnabled: soundsEnabled,
  })
  const [switchOff] = useSound(offSound, {
    interrupt: true,
    soundEnabled: soundsEnabled,
  })

  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10 })

  return (
    <div className="flex items-center">
      <span className="mr-5">Sounds</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <animated.button
              style={style}
              onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
              type="button"
              aria-label="Toggle sounds"
              onClick={() => {
                soundsEnabled ? switchOff() : switchOn()
                toggleSounds()
              }}
              className="rounded-md p-1 focus:bg-gray-100 focus:outline-none md:first-letter:p-2 dark:focus:bg-gray-800"
            >
              {soundsEnabled ? <VolumeX /> : <Volume2 />}
            </animated.button>
          </TooltipTrigger>
          <TooltipContent>Toggle sounds</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}