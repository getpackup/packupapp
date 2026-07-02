import { MountainSnow } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { usePlan } from '~/lib/usePlan'

const UPGRADE_TIMEOUT_MS = 20_000

export type CheckoutUpgradeStatus = 'idle' | 'processing' | 'timeout'

function clearCheckoutParam(params: URLSearchParams) {
  const next = new URLSearchParams(params)
  next.delete('checkout')
  return next
}

export function useCheckoutUpgradeStatus(): CheckoutUpgradeStatus {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isPro } = usePlan()
  const isCheckoutReturn = searchParams.get('checkout') === 'success'

  const [status, setStatus] = useState<CheckoutUpgradeStatus>(
    isCheckoutReturn && !isPro ? 'processing' : 'idle'
  )
  // Guards against firing the success toast or the timeout fallback more than
  // once, since clearing the `checkout` param and later plan changes both
  // re-trigger these effects.
  const hasResolvedRef = useRef(false)

  useEffect(() => {
    if (!isCheckoutReturn || hasResolvedRef.current || !isPro) return

    hasResolvedRef.current = true
    toast.success("You're now on the Pro plan!", {
      icon: <MountainSnow className="size-4" />,
    })
    setSearchParams(clearCheckoutParam, { replace: true })
    setStatus('idle')
  }, [isCheckoutReturn, isPro, setSearchParams])

  useEffect(() => {
    if (!isCheckoutReturn || hasResolvedRef.current) return

    const timer = setTimeout(() => {
      if (hasResolvedRef.current) return
      hasResolvedRef.current = true
      setStatus('timeout')
      setSearchParams(clearCheckoutParam, { replace: true })
    }, UPGRADE_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [isCheckoutReturn, setSearchParams])

  return status
}
