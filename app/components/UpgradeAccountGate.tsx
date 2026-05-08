import { UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useIsAnonymous } from '~/lib/useIsAnonymous'

import { Button } from './ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty'

interface UpgradeAccountGateProps {
  message: string
  children: ReactNode
}

export function UpgradeAccountGate({ message, children }: UpgradeAccountGateProps) {
  const isAnonymous = useIsAnonymous()

  if (!isAnonymous) {
    return <>{children}</>
  }

  return (
    <>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserPlus />
          </EmptyMedia>
          <EmptyTitle>{message}</EmptyTitle>
          <EmptyDescription>
            Keep your trips, invite friends, and access your data from any device.
          </EmptyDescription>
          <EmptyContent>
            <Button variant="accent" size="lg" asChild>
              <Link to="/signup">
                <UserPlus className="size-4" />
                Create Account
              </Link>
            </Button>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
      {/* <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="bg-muted rounded-full p-4">
          <UserPlus className="text-muted-foreground size-8" />
        </div>
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-muted-foreground text-sm">
            Keep your trips, invite friends, and access your data from any device.
          </p>
        </div>
        <Button variant="accent" size="lg" asChild>
          <Link to="/signup">
            <UserPlus className="size-4" />
            Create Account
          </Link>
        </Button>
      </div> */}
    </>
  )
}
