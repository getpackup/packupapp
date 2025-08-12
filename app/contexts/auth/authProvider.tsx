import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

import { firebaseAuth } from '~/firebase/config'
import type { AuthUser } from '~/types/AuthUser'

import AuthContext from './authContext'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: User | null) => {
      setUser(
        user
          ? {
              displayName: user.displayName,
              email: user.email,
              uid: user.uid,
            }
          : null
      )
    })
    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}
