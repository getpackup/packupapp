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
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan | undefined>(undefined)

  useEffect(() => {
    if (!user?.uid) return

    const userRef = doc(firestoreDb, 'users', user.uid)
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.exists() ? (snap.data() as Partial<User>) : {}
      setPlan(data.plan ?? 'free')
    })

    return unsub
  }, [user?.uid])

  if (!user?.uid) {
    return { plan: 'free', isPro: false, isFree: true, isLoading: false }
  }

  if (plan === undefined) {
    return { plan: 'free', isPro: false, isFree: true, isLoading: true }
  }

  return {
    plan,
    isPro: plan === 'pro',
    isFree: plan === 'free',
    isLoading: false,
  }
}
