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
  message?: string
  children: ReactNode
}

const DEFAULT_MESSAGE = 'Plan on your computer, pack from your phone — and bring your whole crew.'

export function UpgradeAccountGate({
  message = DEFAULT_MESSAGE,
  children,
}: UpgradeAccountGateProps) {
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
                Create account
              </Link>
            </Button>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    </>
  )
}
