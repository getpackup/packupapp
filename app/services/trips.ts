import { type QueryObserverOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  type QueryConstraint,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import type { ChatMessage, UserReadStatus } from '~/types/Chat'
import type { PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

const tripRootKey = ['trips'] as const

export const tripKeys = {
  root: tripRootKey,
  all: (constraints: QueryConstraint[]) => [...tripRootKey, ...constraints] as const,
  byId: (tripId: string) => [...tripRootKey, tripId] as const,
  packingListRoot: (tripId: string) => [...tripRootKey, tripId, 'packing-list'] as const,
  packingList: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'packing-list', ...constraints] as const,
  membersRoot: (tripId: string) => [...tripRootKey, tripId, 'trip-members'] as const,
  members: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'trip-members', ...constraints] as const,
  messagesRoot: (tripId: string) => [...tripRootKey, tripId, 'messages'] as const,
  messages: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'messages', ...constraints] as const,
  chatReadStatus: (tripId: string) => [...tripRootKey, tripId, 'chatReadStatus'] as const,
}

export function useTripsQuery({
  constraints,
  queryOptions,
}: {
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<Trip[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<Trip[], Error>({
    queryKey: tripKeys.all(constraints),
    queryFn: async (): Promise<Trip[]> => {
      const tripsCollectionRef = collection(firestoreDb, 'trips')

      if (constraints?.length) {
        const q = query(tripsCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
          return doc.data() as Trip
        })
      }

      const querySnapshot = await getDocs(tripsCollectionRef)
      return querySnapshot.docs.map((doc) => {
        return doc.data() as Trip
      })
    },
    // Keep trip data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Cache trip data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useTripByIdQuery({ tripId }: { tripId: string }) {
  return useQuery<Trip, Error>({
    queryKey: tripKeys.byId(tripId),
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'trips', tripId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Trip does not exist')
      }

      return { tripId: docSnap.id, ...docSnap.data() } as Trip
    },
    staleTime: 5 * 60 * 1000,
    // Cache document data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useTripMembersQuery({
  tripId,
  constraints,
  queryOptions,
}: {
  tripId: string
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<User[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<User[], Error>({
    queryKey: tripKeys.members(tripId, constraints),
    queryFn: async (): Promise<User[]> => {
      const usersCollectionRef = collection(firestoreDb, 'users')

      const q = query(usersCollectionRef, ...constraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]
    },
    // Keep user data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Cache user data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useTripPackingListQuery({
  tripId,
  constraints,
  queryOptions,
}: {
  tripId: string
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<PackingListItem[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery({
    queryKey: tripKeys.packingList(tripId, constraints),
    queryFn: async () => {
      const subCollectionRef = collection(firestoreDb, 'trips', tripId, 'packing-list')

      if (constraints?.length) {
        const q = query(subCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PackingListItem[]
      }

      const querySnapshot = await getDocs(subCollectionRef)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PackingListItem[]
    },
    enabled: !!tripId,
    staleTime: 0,
    // Cache subcollection data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useTripChatMessagesQuery({
  tripId,
  constraints,
  queryOptions,
}: {
  tripId: string
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<ChatMessage[], Error>, 'queryKey' | 'queryFn'>
}) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queryClient = useQueryClient()

  // Memoize queryKey to ensure stable reference
  const queryKey = useMemo(() => tripKeys.messages(tripId, constraints), [tripId, constraints])

  const queryResult = useQuery<ChatMessage[]>({
    queryKey,
    queryFn: () => {
      // This won't actually be called due to staleTime: Infinity
      return Promise.resolve([] as ChatMessage[])
    },
    staleTime: Infinity,
    ...queryOptions,
  })

  useEffect(() => {
    if (!tripId) return

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    const subCollectionRef = collection(firestoreDb, 'trips', tripId, 'messages')

    const firestoreQuery = constraints?.length
      ? query(subCollectionRef, ...constraints)
      : subCollectionRef

    unsubscribeRef.current = onSnapshot(
      firestoreQuery,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]
        // Use setQueryData with the exact queryKey to trigger re-renders
        queryClient.setQueryData(queryKey, docs)
      },
      (error) => {
        console.error('Error in chat messages subscription:', error)
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [tripId, constraints, queryClient, queryKey])

  return queryResult
}

export function useTripChatReadStatusQuery({
  tripId,
  queryOptions,
}: {
  tripId: string
  queryOptions?: Omit<QueryObserverOptions<UserReadStatus[], Error>, 'queryKey' | 'queryFn'>
}) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queryClient = useQueryClient()

  // Memoize queryKey to ensure stable reference
  const queryKey = useMemo(() => tripKeys.chatReadStatus(tripId), [tripId])

  const queryResult = useQuery<UserReadStatus[]>({
    queryKey,
    queryFn: () => {
      // This won't actually be called due to staleTime: Infinity
      return Promise.resolve([] as UserReadStatus[])
    },
    staleTime: Infinity,
    ...queryOptions,
  })

  useEffect(() => {
    if (!tripId) return

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    const subCollectionRef = collection(firestoreDb, 'trips', tripId, 'chatReadStatus')

    unsubscribeRef.current = onSnapshot(
      subCollectionRef,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]
        // Use setQueryData with the exact queryKey to trigger re-renders
        queryClient.setQueryData(queryKey, docs)
      },
      (error) => {
        console.error('Error in chat messages subscription:', error)
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [tripId, queryClient, queryKey])

  return queryResult
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient()
  const tripQueryKey = tripKeys.byId(tripId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<Trip> }) => {
      const docRef = doc(firestoreDb, 'trips', tripId)
      const updateTimestamp = Timestamp.fromDate(new Date())
      const updateData = { ...data, updated: updateTimestamp }

      await updateDoc(docRef, updateData)
      return { ...updateData, tripId }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: tripQueryKey })

      const previousData = queryClient.getQueryData(tripQueryKey)

      // Optimistically update to the new value
      const updateTimestamp = Timestamp.fromDate(new Date())
      queryClient.setQueryData(tripQueryKey, (old: Trip | undefined) => ({
        ...(old ?? { tripId }),
        ...data,
        updated: updateTimestamp,
      }))

      return { previousData }
    },
    onSuccess: () => {
      toast.success(`Trip updated successfully`)
      // trackEvent('Trip Updated Successfully', {
      //   tripId: id,
      //   ...previousTripData,
      //   ...data,
      // })
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tripQueryKey, context.previousData)
      }
      toast.error(err.message)
      // trackEvent(`Trip Update Failure`, {
      // tripId: id,
      //   ...previousTripData,
      // error: err,
      // })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKey })
      queryClient.invalidateQueries({
        queryKey: tripKeys.membersRoot(tripId),
      })
    },
  })
}

export function useCreatePackingListItem() {
  const queryClient = useQueryClient()

  return useMutation<
    PackingListItem,
    Error,
    { tripId: string; data: Omit<PackingListItem, 'id'> },
    { previousQueries: Array<[unknown, unknown]>; tempId: string }
  >({
    mutationFn: async ({ tripId, data }) => {
      const subCollectionRef = collection(firestoreDb, 'trips', tripId, 'packing-list')
      const documentData = { ...data }
      const docRef = await addDoc(subCollectionRef, documentData)
      return { ...documentData, id: docRef.id }
    },
    onMutate: async ({ tripId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: tripKeys.packingListRoot(tripId),
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.packingListRoot(tripId),
      })

      // Generate a temporary ID for the optimistic document
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticDocument = { ...data, id: tempId }

      // Optimistically add the document to all matching queries
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = [...queryData, optimisticDocument]
          queryClient.setQueryData(queryKey, updatedData)
        }
      })

      return { previousQueries, tempId }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
    },
    onSuccess: (realDocument, variables, context) => {
      // Replace temporary document with real one in all queries
      // This ensures consistency if subscription hasn't updated yet
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.packingListRoot(variables.tripId),
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            const updatedData = queryData.map((item: any) =>
              item.id === context.tempId ? realDocument : item
            ) as PackingListItem[]
            queryClient.setQueryData(queryKey, updatedData)
          }
        })
      }
    },
  })
}

export function useCreateChatMessage() {
  const queryClient = useQueryClient()

  return useMutation<
    ChatMessage,
    Error,
    { tripId: string; data: Omit<ChatMessage, 'id' | 'createdAt'> },
    { previousQueries: Array<[unknown, unknown]>; tempId: string }
  >({
    mutationFn: async ({ tripId, data }) => {
      const subCollectionRef = collection(firestoreDb, 'trips', tripId, 'messages')
      const documentData = { ...data }
      const docRef = await addDoc(subCollectionRef, documentData)
      return { ...documentData, id: docRef.id, createdAt: Timestamp.now() }
    },
    onMutate: async ({ tripId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: tripKeys.messagesRoot(tripId),
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(tripId),
      })

      // Generate a temporary ID for the optimistic document
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticDocument = { ...data, id: tempId }

      // Optimistically add the document to all matching queries
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = [...queryData, optimisticDocument]
          queryClient.setQueryData(queryKey, updatedData)
        }
      })

      return { previousQueries, tempId }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
    },
    onSuccess: (realDocument, variables, context) => {
      // Replace temporary document with real one in all queries
      // This ensures consistency if subscription hasn't updated yet
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(variables.tripId),
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            const updatedData = queryData.map((item: any) =>
              item.id === context.tempId ? realDocument : item
            )
            queryClient.setQueryData(queryKey, updatedData)
          }
        })
      }
    },
  })
}

export function useUpdateChatMessage({
  tripId,
  chatMessageId,
}: {
  tripId: string
  chatMessageId: string
}) {
  const queryClient = useQueryClient()
  const chatMessagesQueryKey = tripKeys.messagesRoot(tripId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<ChatMessage> }) => {
      const docRef = doc(firestoreDb, 'trips', tripId, 'messages', chatMessageId)
      const updateTimestamp = Timestamp.fromDate(new Date())
      const updateData = { ...data, updated: updateTimestamp }

      await updateDoc(docRef, updateData)
      return { id: chatMessageId, ...updateData }
    },
    onMutate: async ({ data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatMessagesQueryKey,
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: chatMessagesQueryKey,
      })

      // Optimistically update all matching queries
      const updateTimestamp = Timestamp.fromDate(new Date())
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.map((item: any) =>
            item.id === chatMessageId ? { ...item, ...data, updated: updateTimestamp } : item
          )
          queryClient.setQueryData(queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
    },
    onSettled: () => {
      // Don't invalidate queries - the subscription will handle real-time updates automatically
      // The optimistic update in onMutate already updates the UI, and the subscription will sync with Firestore
    },
  })
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, chatMessageId }: { tripId: string; chatMessageId: string }) => {
      const docRef = doc(firestoreDb, 'trips', tripId, 'messages', chatMessageId)
      await deleteDoc(docRef)
    },
    onMutate: async ({ tripId, chatMessageId }) => {
      await queryClient.cancelQueries({
        queryKey: tripKeys.messagesRoot(tripId),
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(tripId),
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.filter((item: any) => item.id !== chatMessageId)
          queryClient.setQueryData(queryKey, updatedData)
        }
      })
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
    },
    onSuccess: () => {
      // Don't invalidate queries - the subscription will handle real-time updates automatically
      // The optimistic update in onMutate already updates the UI, and the subscription will sync with Firestore
    },
  })
}

export function useUpdateTypingStatus(tripId: string, userId: string | undefined) {
  return useMutation({
    mutationFn: async ({ isTyping }: { isTyping: boolean }) => {
      if (!userId || !tripId) return

      const docRef = doc(firestoreDb, 'trips', tripId, 'chatReadStatus', userId)

      if (isTyping) {
        // Set typingStartedAt to current timestamp
        await setDoc(
          docRef,
          {
            userId,
            typingStartedAt: Timestamp.now(),
          },
          { merge: true }
        )
      } else {
        // Clear typingStartedAt
        await updateDoc(docRef, {
          typingStartedAt: deleteField(),
        })
      }
    },
  })
}

export function useUpdatePackingListItem({ tripId }: { tripId: string }) {
  const queryClient = useQueryClient()
  const packingListItemQueryKey = tripKeys.packingListRoot(tripId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<PackingListItem> & { id: string } }) => {
      const { id, ...rest } = data
      const docRef = doc(firestoreDb, 'trips', tripId, 'packing-list', id)
      const updateTimestamp = Timestamp.fromDate(new Date())
      const updateData = { ...rest, updated: updateTimestamp }

      await updateDoc(docRef, updateData)
      return { id, ...updateData }
    },
    onMutate: async ({ data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: packingListItemQueryKey,
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: packingListItemQueryKey,
      })

      // Optimistically update all matching queries
      const updateTimestamp = Timestamp.fromDate(new Date())
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.map((item: any) =>
            item.id === data.id ? { ...item, ...data, updated: updateTimestamp } : item
          )
          queryClient.setQueryData(queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
    },
    onSettled: () => {
      // Don't invalidate queries - the subscription will handle real-time updates automatically
      // The optimistic update in onMutate already updates the UI, and the subscription will sync with Firestore
    },
  })
}

export function useDeletePackingListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tripId,
      packingListItemId,
    }: {
      tripId: string
      packingListItemId: string
    }) => {
      const docRef = doc(firestoreDb, 'trips', tripId, 'packing-list', packingListItemId)
      await deleteDoc(docRef)
    },
    onMutate: async ({ tripId, packingListItemId }) => {
      await queryClient.cancelQueries({
        queryKey: tripKeys.packingListRoot(tripId),
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.packingListRoot(tripId),
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.filter((item: any) => item.id !== packingListItemId)
          queryClient.setQueryData(queryKey, updatedData)
        }
      })
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
    },
    onSuccess: () => {
      // Don't invalidate queries - the subscription will handle real-time updates automatically
      // The optimistic update in onMutate already updates the UI, and the subscription will sync with Firestore
    },
  })
}
