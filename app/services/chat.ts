import { type QueryObserverOptions,useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  type QueryConstraint,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useMemo, useRef } from 'react'

import { firestoreDb } from '~/firebase/config'
import type { ChatMessage, UserReadStatus } from '~/types/Chat'

import { tripKeys } from './tripKeys'

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

  const queryKey = useMemo(() => tripKeys.messages(tripId, constraints), [tripId, constraints])

  const queryResult = useQuery<ChatMessage[]>({
    queryKey,
    queryFn: () => Promise.resolve([] as ChatMessage[]),
    staleTime: Infinity,
    ...queryOptions,
  })

  useEffect(() => {
    if (!tripId) return

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

  const queryKey = useMemo(() => tripKeys.chatReadStatus(tripId), [tripId])

  const queryResult = useQuery<UserReadStatus[]>({
    queryKey,
    queryFn: () => Promise.resolve([] as UserReadStatus[]),
    staleTime: Infinity,
    ...queryOptions,
  })

  useEffect(() => {
    if (!tripId) return

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
      const docRef = await addDoc(subCollectionRef, { ...data })
      return { ...data, id: docRef.id, createdAt: Timestamp.now() }
    },
    onMutate: async ({ tripId, data }) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.messagesRoot(tripId) })

      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(tripId),
      })

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticDocument = { ...data, id: tempId }

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(queryKey, [...queryData, optimisticDocument])
        }
      })

      return { previousQueries, tempId }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
    },
    onSuccess: (realDocument, variables, context) => {
      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(variables.tripId),
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            queryClient.setQueryData(
              queryKey,
              queryData.map((item: any) =>
                item.id === context.tempId ? realDocument : item
              )
            )
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
      await queryClient.cancelQueries({ queryKey: chatMessagesQueryKey })

      const previousQueries = queryClient.getQueriesData({ queryKey: chatMessagesQueryKey })
      const updateTimestamp = Timestamp.fromDate(new Date())

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(
            queryKey,
            queryData.map((item: any) =>
              item.id === chatMessageId ? { ...item, ...data, updated: updateTimestamp } : item
            )
          )
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
      await queryClient.cancelQueries({ queryKey: tripKeys.messagesRoot(tripId) })

      const previousQueries = queryClient.getQueriesData({
        queryKey: tripKeys.messagesRoot(tripId),
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(
            queryKey,
            queryData.filter((item: any) => item.id !== chatMessageId)
          )
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
  })
}

export function useUpdateTypingStatus(tripId: string, userId: string | undefined) {
  return useMutation({
    mutationFn: async ({ isTyping }: { isTyping: boolean }) => {
      if (!userId || !tripId) return

      const docRef = doc(firestoreDb, 'trips', tripId, 'chatReadStatus', userId)

      if (isTyping) {
        await setDoc(docRef, { userId, typingStartedAt: Timestamp.now() }, { merge: true })
      } else {
        await updateDoc(docRef, { typingStartedAt: deleteField() })
      }
    },
  })
}

export function useMarkChatRead(userId: string | undefined) {
  return useMutation({
    mutationFn: async ({
      tripId,
      lastReadMessageId,
    }: {
      tripId: string
      lastReadMessageId: string
    }) => {
      if (!userId || !tripId) return

      const docRef = doc(firestoreDb, 'trips', tripId, 'chatReadStatus', userId)
      await setDoc(
        docRef,
        { userId, lastReadAt: Timestamp.now(), lastReadMessageId },
        { merge: true }
      )
    },
  })
}
