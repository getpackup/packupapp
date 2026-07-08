import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { useAuth } from '~/contexts/auth/useAuth'
import { firestoreDb } from '~/firebase/config'
import type { Plan, User } from '~/types/User'

type UsePlanResult = {
  plan: Plan
  isPro: boolean
  isFree: boolean
  isLoading: boolean
  cancelAtPeriodEnd: boolean
  periodEnd: number | null | undefined
}

type PlanState = {
  plan: Plan
  cancelAtPeriodEnd: boolean
  periodEnd: number | null | undefined
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth()
  const [state, setState] = useState<PlanState | undefined>(undefined)

  useEffect(() => {
    if (!user?.uid) return

    const userRef = doc(firestoreDb, 'users', user.uid)
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.exists() ? (snap.data() as Partial<User>) : {}
      const storedPlan = data.plan ?? 'free'
      const periodEnd = data.subscriptionCurrentPeriodEnd
      const isExpired = typeof periodEnd === 'number' && periodEnd * 1000 < Date.now()
      setState({
        plan: storedPlan === 'pro' && isExpired ? 'free' : storedPlan,
        cancelAtPeriodEnd: data.subscriptionCancelAtPeriodEnd ?? false,
        periodEnd,
      })
    })

    return unsub
  }, [user?.uid])

  if (!user?.uid) {
    return { plan: 'free', isPro: false, isFree: true, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }
  }

  if (state === undefined) {
    return { plan: 'free', isPro: false, isFree: true, isLoading: true, cancelAtPeriodEnd: false, periodEnd: undefined }
  }

  return {
    plan: state.plan,
    isPro: state.plan === 'pro',
    isFree: state.plan === 'free',
    isLoading: false,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    periodEnd: state.periodEnd,
  }
}
