import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'

import { usePlan } from '~/lib/usePlan'

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface PlanGateProps {
  feature: string
  children: ReactNode
}

export function PlanGate({ feature, children }: PlanGateProps) {
  const { isPro } = usePlan()

  if (isPro) {
    return <>{children}</>
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div
          data-testid="plan-gate-locked"
          className="relative inline-block cursor-not-allowed"
          aria-disabled="true"
        >
          <div className="pointer-events-none opacity-50">{children}</div>
          <div
            data-testid="plan-gate-lock-icon"
            className="absolute inset-0 flex items-center justify-center"
          >
            <Lock className="size-4" aria-hidden="true" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {feature} is a Pro feature.{' '}
        <a
          href="https://getpackup.com/pricing"
          className="underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          Upgrade to Pro
        </a>
      </TooltipContent>
    </Tooltip>
  )
}
