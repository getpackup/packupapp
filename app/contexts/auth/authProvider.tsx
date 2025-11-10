import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'

import FullPageSpinner from '~/components/FullPageSpinner'
import { firebaseAuth } from '~/firebase/config'
import { useUserByIdQuery } from '~/services/users'
import type { User } from '~/types/User'

import AuthContext from './authContext'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const { data: userData, isLoading: userDataLoading } = useUserByIdQuery({
    userId: firebaseUser?.uid ?? '',
  })

  // Memoize the user object to prevent unnecessary re-renders
  const currentUser = useMemo((): User | null => {
    if (!firebaseUser) return null
    if (userDataLoading) return null

    if (userData) {
      return {
        ...userData,
        email: firebaseUser.email ?? userData.email,
        displayName: userData.displayName || firebaseUser.displayName || '',
        createdAt:
          userData.createdAt ||
          Timestamp.fromDate(new Date(firebaseUser.metadata.creationTime ?? '')),
      }
    } else {
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? '',
        username: '',
        bio: '',
        emergencyContacts: [],
        isAdmin: false,
        location: '',
        photoURL: '',
        profileHeaderImage: '',
        searchableIndex: [],
        website: '',
        preferences: {
          theme: 'light' as const,
          hasSeenPackingListTour: false,
        },
      }
    }
  }, [firebaseUser, userData, userDataLoading])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
      setFirebaseUser(user)
      // Only show loading on first auth check, not on subsequent route changes
      if (!isInitialized) {
        setIsInitialized(true)
      }
    })
    return () => unsubscribe()
  }, [isInitialized])

  useEffect(() => {
    setUser(currentUser)
  }, [currentUser])

  // Don't show loading spinner if we already have a user
  // This prevents the spinner from showing on route changes
  if (!isInitialized && !user) {
    return <FullPageSpinner />
  }

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}
