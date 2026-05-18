import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
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
import type { User } from '~/types/User'

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const friendsRootKey = ['friendships'] as const

export const friendKeys = {
  root: friendsRootKey,
  byUid: (uid: string) => [...friendsRootKey, 'byUid', uid] as const,
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

export async function fetchAllFriendships(uid: string): Promise<Friendship[]> {
  const q = query(collection(firestoreDb, 'friendships'), where('uids', 'array-contains', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Friendship)
}

// This is the main query for fetching friendships for a user.
// The other hooks (declined, pending, sent) filter this data accordingly.
export function useFriendsQuery(uid: string) {
  return useQuery<Friendship[], Error, Friendship[]>({
    queryKey: friendKeys.byUid(uid),
    queryFn: () => fetchAllFriendships(uid),
    select: (data) => data.filter((f) => f.status === 'accepted'),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function useFriendUsersQuery(uid: string) {
  const { data: friendships, isLoading: isFriendshipsLoading } = useFriendsQuery(uid)

  const friendUids = (friendships ?? [])
    .map((f) => f.uids.find((u) => u !== uid))
    .filter((u): u is string => !!u)

  const userQueries = useQueries({
    queries: friendUids.map((friendUid) => ({
      queryKey: ['users', friendUid] as const,
      queryFn: async () => {
        const docRef = doc(firestoreDb, 'users', friendUid)
        const snap = await getDoc(docRef)
        if (!snap.exists()) return null
        return { uid: snap.id, ...snap.data() } as User
      },
    })),
  })

  return {
    data: userQueries.map((q) => q.data).filter((u): u is User => u != null),
    isLoading: isFriendshipsLoading || userQueries.some((q) => q.isLoading),
  }
}

export function useDeclinedFriendshipsQuery(uid: string) {
  return useQuery<Friendship[], Error, Friendship[]>({
    queryKey: friendKeys.byUid(uid),
    queryFn: () => fetchAllFriendships(uid),
    select: (data) => data.filter((f) => f.status === 'declined'),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function usePendingFriendRequestsQuery(uid: string) {
  return useQuery<Friendship[], Error, Friendship[]>({
    queryKey: friendKeys.byUid(uid),
    queryFn: () => fetchAllFriendships(uid),
    select: (data) => data.filter((f) => f.status === 'pending' && f.requesterUid !== uid),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function useSentFriendRequestsQuery(uid: string) {
  return useQuery<Friendship[], Error, Friendship[]>({
    queryKey: friendKeys.byUid(uid),
    queryFn: () => fetchAllFriendships(uid),
    select: (data) => data.filter((f) => f.status === 'pending' && f.requesterUid === uid),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ senderUid, recipientUid }: { senderUid: string; recipientUid: string }) =>
      sendFriendRequest(senderUid, recipientUid),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.byUid(variables.senderUid) })
      toast.success('Friend request sent')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useAcceptFriendRequest(currentUid: string) {
  const queryClient = useQueryClient()
  const queryKey = friendKeys.byUid(currentUid)

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) => acceptFriendRequest(friendshipId),
    onMutate: async ({ friendshipId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Friendship[]>(queryKey)
      queryClient.setQueryData<Friendship[]>(queryKey, (old) =>
        old?.map((f) =>
          f.id === friendshipId ? { ...f, status: 'accepted' as const, respondedAt: Timestamp.now() } : f
        )
      )
      return { previous }
    },
    onSuccess: () => {
      toast.success('Friend request accepted')
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useDeclineFriendRequest(currentUid: string) {
  const queryClient = useQueryClient()
  const queryKey = friendKeys.byUid(currentUid)

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      declineFriendRequest(friendshipId),
    onMutate: async ({ friendshipId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Friendship[]>(queryKey)
      const now = Timestamp.now()
      queryClient.setQueryData<Friendship[]>(queryKey, (old) =>
        old?.map((f) =>
          f.id === friendshipId
            ? { ...f, status: 'declined' as const, declinedAt: now, respondedAt: now }
            : f
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUnfriend(currentUid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) => unfriend(friendshipId),
    onMutate: async ({ friendshipId }) => {
      await queryClient.cancelQueries({ queryKey: friendKeys.byUid(currentUid) })
      const previous = queryClient.getQueryData<Friendship[]>(friendKeys.byUid(currentUid))
      queryClient.setQueryData<Friendship[]>(friendKeys.byUid(currentUid), (old) =>
        old ? old.filter((f) => f.id !== friendshipId) : []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(friendKeys.byUid(currentUid), context.previous)
      }
      toast.error('Failed to remove friend')
    },
    onSuccess: () => {
      toast.success('Friend removed')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.byUid(currentUid) })
    },
  })
}
