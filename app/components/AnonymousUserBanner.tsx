import { Info, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '~/components/ui/button'

interface AnonymousUserBannerProps {
  primary: string
  secondary: string
}

export function AnonymousUserBanner({ primary, secondary }: AnonymousUserBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
        <Info className="size-4 shrink-0" />
        <div>
          <p>{primary}</p>
          <p className="text-blue-600 dark:text-blue-400">{secondary}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="accent" size="sm" asChild>
          <Link to="/signup">
            <UserPlus className="size-3" />
            Sign up free
          </Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
