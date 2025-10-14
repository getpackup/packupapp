import { Moon, Sun } from 'lucide-react'
import { type MouseEventHandler } from 'react'
import { Form } from 'react-router'
import { animated } from 'react-spring'
import useSound from 'use-sound'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useAuth } from '~/contexts/auth/useAuth'
import useBoop from '~/lib/useBoop'
import { useRootLoaderData } from '~/lib/useRootLoaderData'
import { useUpdateDocument } from '~/services/api'

import offSound from '../../sounds/switch-off.mp3'
import onSound from '../../sounds/switch-on.mp3'

export function ThemeToggle() {
  const [switchOn] = useSound(onSound, {
    interrupt: true,
    soundEnabled: true,
  })
  const [switchOff] = useSound(offSound, {
    interrupt: true,
    soundEnabled: true,
  })

  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10 })

  const { themePreference } = useRootLoaderData()
  const { user } = useAuth()
  const updateUser = useUpdateDocument('users')

  const isDarkMode = themePreference === 'dark'

  const handleThemeToggle = () => {
    isDarkMode ? switchOn() : switchOff()

    // Update theme preference in Firebase
    if (user?.uid) {
      const newTheme = isDarkMode ? 'light' : 'dark'
      updateUser.mutate({
        id: user.uid,
        data: {
          'preferences.theme': newTheme,
        },
      })
    }
  }

  return (
    <Form method="post" action="/resource/toggle-theme">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <animated.button
              style={style}
              onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
              type="submit"
              aria-label={'Toggle theme'}
              onClick={handleThemeToggle}
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
