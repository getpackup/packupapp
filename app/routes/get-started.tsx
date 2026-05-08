import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { firebaseAuth } from '~/firebase/config'
import { useCreateUser } from '~/services/users'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Get Started | Packup' },
    {
      name: 'description',
      content: 'Try Packup free — no account needed. Create a trip and start packing right away.',
    },
  ]
}

export default function GetStarted() {
  const navigate = useNavigate()
  const { mutateAsync: createUserAsync } = useCreateUser()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user && !user.isAnonymous) {
        navigate('/trips', { replace: true })
        return
      }

      if (user && user.isAnonymous) {
        navigate('/trips/new', { replace: true })
        return
      }

      try {
        const result = await signInAnonymously(firebaseAuth)
        const now = Timestamp.now()

        await createUserAsync({
          id: result.user.uid,
          uid: result.user.uid,
          email: '',
          displayName: '',
          username: '',
          isAnonymous: true,
          createdAt: now,
          lastUpdated: now,
        })

        navigate('/trips/new', { replace: true })
      } catch (err) {
        console.error('Anonymous sign-in failed:', err)
        setError('Something went wrong. Please try again.')
      }
    })

    return () => unsubscribe()
  }, [navigate, createUserAsync])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <a href="/" className="font-bold hover:underline">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-muted-foreground">Setting up your experience...</p>
    </div>
  )
}
