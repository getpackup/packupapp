import { Lock, MountainSnow } from 'lucide-react'
import type { ReactNode } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { usePlan } from '~/lib/usePlan'

import { Alert, AlertAction, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'

interface PlanGateProps {
  featureDescription: string
  children: ReactNode
}

export function PlanGate({ featureDescription, children }: PlanGateProps) {
  const { isPro } = usePlan()
  const { user } = useAuth()

  if (isPro) {
    return <>{children}</>
  }

  return (
    <div data-testid="plan-gate-locked" className="flex flex-col gap-3" aria-disabled="true">
      <Alert variant="accent">
        <Lock aria-hidden="true" />
        <AlertTitle>Upgrade to Pro</AlertTitle>
        <AlertDescription>{featureDescription}</AlertDescription>
        <AlertAction>
          <Button asChild size="sm" variant="default">
            <a
              href={`https://getpackup.com/pricing${user?.uid ? `?uid=${user.uid}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MountainSnow className="size-4" />
              Upgrade
            </a>
          </Button>
        </AlertAction>
      </Alert>
      <fieldset disabled className="contents">
        {children}
      </fieldset>
    </div>
  )
}
