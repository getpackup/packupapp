import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import { buildFriendshipId, type Friendship } from '~/types/Friendship'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const friendsRootKey = ['friendships'] as const

export const friendKeys = {
  root: friendsRootKey,
  byUid: (uid: string) => [...friendsRootKey, 'byUid', uid] as const,
  requestsForUid: (uid: string) => [...friendsRootKey, 'requests', uid] as const,
}

export async function sendFriendRequest(senderUid: string, recipientUid: string): Promise<void> {
  const friendshipId = buildFriendshipId(senderUid, recipientUid)
  const docRef = doc(firestoreDb, 'friendships', friendshipId)
  const existing = await getDoc(docRef)

  if (existing.exists()) {
    const data = existing.data()
    if (data.status === 'accepted') {
      throw new Error('You are already friends with this user')
    }
    if (data.status === 'pending') {
      throw new Error('A friend request is already pending')
    }
    if (data.status === 'declined' && data.declinedAt) {
      const declinedMs = data.declinedAt.toMillis()
      if (Date.now() - declinedMs < THIRTY_DAYS_MS) {
        throw new Error('Cannot re-send: 30-day cooldown has not elapsed')
      }
    }
  }

  await setDoc(docRef, {
    uids: [senderUid, recipientUid],
    requesterUid: senderUid,
    status: 'pending',
    requestedAt: Timestamp.now(),
  })
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const docRef = doc(firestoreDb, 'friendships', friendshipId)
  await updateDoc(docRef, {
    status: 'accepted',
    respondedAt: Timestamp.now(),
  })
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  const docRef = doc(firestoreDb, 'friendships', friendshipId)
  const now = Timestamp.now()
  await updateDoc(docRef, {
    status: 'declined',
    declinedAt: now,
    respondedAt: now,
  })
}

export async function unfriend(friendshipId: string): Promise<void> {
  const docRef = doc(firestoreDb, 'friendships', friendshipId)
  await deleteDoc(docRef)
}

export async function fetchFriendships(uid: string): Promise<Friendship[]> {
  const q = query(
    collection(firestoreDb, 'friendships'),
    where('uids', 'array-contains', uid),
    where('status', '==', 'accepted')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Friendship)
}

export async function fetchPendingRequests(uid: string): Promise<Friendship[]> {
  const q = query(
    collection(firestoreDb, 'friendships'),
    where('uids', 'array-contains', uid),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Friendship)
    .filter((f) => f.requesterUid !== uid)
}

export function useFriendsQuery(uid: string) {
  return useQuery<Friendship[], Error>({
    queryKey: friendKeys.byUid(uid),
    queryFn: () => fetchFriendships(uid),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function usePendingFriendRequestsQuery(uid: string) {
  return useQuery<Friendship[], Error>({
    queryKey: friendKeys.requestsForUid(uid),
    queryFn: () => fetchPendingRequests(uid),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      senderUid,
      recipientUid,
    }: {
      senderUid: string
      recipientUid: string
    }) => sendFriendRequest(senderUid, recipientUid),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.byUid(variables.senderUid) })
      queryClient.invalidateQueries({ queryKey: friendKeys.requestsForUid(variables.senderUid) })
      toast.success('Friend request sent')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useAcceptFriendRequest(currentUid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.byUid(currentUid) })
      queryClient.invalidateQueries({ queryKey: friendKeys.requestsForUid(currentUid) })
      toast.success('Friend request accepted')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useDeclineFriendRequest(currentUid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      declineFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.requestsForUid(currentUid) })
    },
  })
}

export function useUnfriend(currentUid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) => unfriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.byUid(currentUid) })
      toast.success('Friend removed')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
