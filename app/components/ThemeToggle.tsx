import { Moon, Sun } from 'lucide-react'
import { type MouseEventHandler } from 'react'
import { Form } from 'react-router'
import { animated } from 'react-spring'
import useSound from 'use-sound'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useAuth } from '~/contexts/auth/useAuth'
import { useSoundsState } from '~/contexts/globalState'
import useBoop from '~/lib/useBoop'
import { useRootLoaderData } from '~/lib/useRootLoaderData'
import { useUpdateUser } from '~/services/users'

export function ThemeToggle() {
  const { soundsEnabled } = useSoundsState()
  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10})

  const [switchOn] = useSound('/sounds/switch-on.mp3', {
    interrupt: true,
  })
  const [switchOff] = useSound('/sounds/switch-off.mp3', {
    interrupt: true,
  })

  const { themePreference } = useRootLoaderData()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')

  const isDarkMode = themePreference === 'dark'

  const handleThemeToggle = () => {
    if (soundsEnabled) {
      isDarkMode ? switchOn() : switchOff()
    }

    // Update theme preference in Firebase
    if (user?.uid) {
      const newTheme = isDarkMode ? 'light' : 'dark'
      updateUserAsync({
        data: {
          preferences: {
            theme: newTheme,
          },
        },
      })
    }
  }

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
