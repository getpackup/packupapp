import { Moon, Sun } from 'lucide-react'
import { type MouseEventHandler } from 'react'
import { Form } from 'react-router'
import { animated } from 'react-spring'
import useSound from 'use-sound'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useSoundsState } from '~/contexts/globalState'
import useBoop from '~/lib/useBoop'
import { useRootLoaderData } from '~/lib/useRootLoaderData'

import offSound from '../../sounds/switch-off.mp3'
import onSound from '../../sounds/switch-on.mp3'

export function ThemeToggle() {
  const { soundsEnabled } = useSoundsState()
  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10})

  const [switchOn] = useSound(onSound, {
    interrupt: true,
  })
  const [switchOff] = useSound(offSound, {
    interrupt: true,
  })

  const { themePreference } = useRootLoaderData()

  const isDarkMode = themePreference === 'dark'

  return (
    <Form method="post" action="/resource/toggle-theme" className="flex items-center">
      <span className="mr-5">Display Theme</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <animated.button
              style={style}
              onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
              type="submit"
              aria-label={'Toggle theme'}
              onClick={() => {
                if (soundsEnabled) {
                  isDarkMode ? switchOn() : switchOff()
                }
              }}
              className="rounded-md p-1 focus:bg-gray-100 focus:outline-none md:first-letter:p-2 dark:focus:bg-gray-800"
            >
              {isDarkMode ? <Sun /> : <Moon />}
            </animated.button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Form>
  )
}
