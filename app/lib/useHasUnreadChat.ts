import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { firestoreDb } from '~/firebase/config'
import useAuth from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import type { ChatMetadata, UserReadStatus } from '~/types/Chat'

export function useHasUnreadChat(tripId: string): boolean {
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const [metadata, setMetadata] = useState<ChatMetadata | null>(null)
  const [readStatus, setReadStatus] = useState<UserReadStatus | null | undefined>(undefined)

  useEffect(() => {
    if (isAnonymous || !user?.uid || !tripId) return

    const metaRef = doc(firestoreDb, 'trips', tripId, 'chatMetadata', 'meta')
    const readRef = doc(firestoreDb, 'trips', tripId, 'chatReadStatus', user.uid)

    const unsubMeta = onSnapshot(metaRef, (snap) => {
      setMetadata(snap.exists() ? (snap.data() as ChatMetadata) : null)
    })

    const unsubRead = onSnapshot(readRef, (snap) => {
      setReadStatus(snap.exists() ? (snap.data() as UserReadStatus) : null)
    })

    return () => {
      unsubMeta()
      unsubRead()
    }
  }, [tripId, user?.uid, isAnonymous])

  if (isAnonymous || !user?.uid) return false
  if (!metadata) return false
  if (!readStatus) return readStatus === null
  return metadata.lastMessageAt.toMillis() > readStatus.lastReadAt.toMillis()
}
