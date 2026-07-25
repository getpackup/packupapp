import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { useHelpModalState } from '~/contexts/globalState'

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "We couldn't open the billing portal. Please contact support.",
  missing_uid: "We couldn't identify your account. Please contact support.",
  user_not_found: "We couldn't find your account. Please contact support.",
  no_customer: "We couldn't find a billing account for you. Please contact support.",
}

const DEFAULT_MESSAGE =
  "We couldn't open the billing portal. Please try again later or contact support."

function clearSubscriptionErrorParam(params: URLSearchParams) {
  const next = new URLSearchParams(params)
  next.delete('subscription_error')
  return next
}

export function useSubscriptionErrorToast() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { setIsHelpOpen } = useHelpModalState()
  const subscriptionError = searchParams.get('subscription_error')
  const hasHandledRef = useRef(false)

  useEffect(() => {
    if (!subscriptionError || hasHandledRef.current) return

    hasHandledRef.current = true
    toast.error(ERROR_MESSAGES[subscriptionError] ?? DEFAULT_MESSAGE)
    setIsHelpOpen(true)
    setSearchParams(clearSubscriptionErrorParam, { replace: true })
  }, [subscriptionError, setIsHelpOpen, setSearchParams])
}
