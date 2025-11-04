import {
  type QueryObserverOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  type QueryConstraint,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useMemo, useRef } from 'react'

import { firestoreDb } from '~/firebase/config'
import type { User } from '~/types/User'

export const firebaseKeys = {
  all: ['firebase'] as const,
  docs: () => [...firebaseKeys.all, 'docs'] as const,
  doc: (collection: string, id: string) => [...firebaseKeys.docs(), collection, id] as const,
  collections: () => [...firebaseKeys.all, 'collections'] as const,
  collection: (name: string, filters?: any) =>
    [...firebaseKeys.collections(), name, filters] as const,
}

export function useDocument<T>(collection: string, uid: string) {
  return useQuery({
    queryKey: firebaseKeys.doc(collection, uid),
    queryFn: async () => {
      const docRef = doc(firestoreDb, collection, uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Document does not exist')
      }

      return { uid: docSnap.id, ...docSnap.data() } as T
    },
    staleTime: 5 * 60 * 1000,
    // Cache document data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useCollection<T>(
  collectionName: string,
  constraints?: QueryConstraint[],
  queryOptions?: QueryObserverOptions
) {
  return useQuery({
    queryKey: firebaseKeys.collection(collectionName, constraints),
    queryFn: async () => {
      const collectionRef = collection(firestoreDb, collectionName)

      if (constraints?.length) {
        const q = query(collectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T
      }

      const querySnapshot = await getDocs(collectionRef)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T
    },
    // Keep collection data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Cache collection data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  }) as ReturnType<typeof useQuery<T>>
}

export function useInfiniteCollection<T>(
  collectionName: string,
  baseConstraints: QueryConstraint[] = [],
  pageSize: number = 10,
  queryOptions?: Partial<QueryObserverOptions>
) {
  return useInfiniteQuery({
    queryKey: firebaseKeys.collection(collectionName, [...baseConstraints, 'infinite']),
    queryFn: async ({ pageParam }: { pageParam: any }) => {
      const collectionRef = collection(firestoreDb, collectionName)

      // Build constraints for this page
      const constraints = [...baseConstraints]

      // Add pagination constraints
      if (pageParam) {
        constraints.push(startAfter(pageParam))
      }
      constraints.push(limit(pageSize))

      const q = query(collectionRef, ...constraints)
      const querySnapshot = await getDocs(q)

      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[]
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

      return {
        data: docs,
        nextCursor: lastDoc,
        hasMore: querySnapshot.docs.length === pageSize,
      }
    },
    initialPageParam: null as any,
    getNextPageParam: (lastPage: any) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  } as any)
}

export function useSubCollection<T>(
  collectionName: string,
  subCollectionName: string,
  parentDocId: string,
  constraints?: QueryConstraint[],
  queryOptions?: Partial<QueryObserverOptions>
) {
  return useQuery({
    queryKey: [
      ...firebaseKeys.collection(collectionName),
      parentDocId,
      subCollectionName,
      constraints,
    ],
    queryFn: async () => {
      const subCollectionRef = collection(
        firestoreDb,
        collectionName,
        parentDocId,
        subCollectionName
      )

      if (constraints?.length) {
        const q = query(subCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T
      }

      const querySnapshot = await getDocs(subCollectionRef)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T
    },
    enabled: !!parentDocId,
    staleTime: 0,
    // Cache subcollection data for 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  }) as ReturnType<typeof useQuery<T>>
}

export function useCreateDocument(collection: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const docRef = doc(firestoreDb, collection, id)
      await setDoc(docRef, { ...data, created: Timestamp.now() })
      return { id, ...data }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: firebaseKeys.collection(collection) })
      queryClient.setQueryData(firebaseKeys.doc(collection, data.id), data)
    },
  })
}

export function useCreateSubCollectionDocument<T>(collectionName: string, subCollection: string) {
  const queryClient = useQueryClient()

  return useMutation<
    T & { id: string; created: Date },
    Error,
    { parentDocId: string; data: Omit<T, 'id' | 'created'> },
    { previousQueries: Array<[unknown, unknown]>; tempId: string }
  >({
    mutationFn: async ({ parentDocId, data }) => {
      const subCollectionRef = collection(firestoreDb, collectionName, parentDocId, subCollection)
      const documentData = { ...data }
      const docRef = await addDoc(subCollectionRef, documentData)
      return { ...documentData, id: docRef.id } as T & { id: string; created: Date }
    },
    onMutate: async ({ parentDocId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })

      // Generate a temporary ID for the optimistic document
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticDocument = { ...data, id: tempId } as T & { id: string }

      // Optimistically add the document to all matching queries
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = [...queryData, optimisticDocument] as T[]
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
        queryKey: [
          ...firebaseKeys.collection(collectionName),
          variables.parentDocId,
          subCollection,
        ],
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            const updatedData = queryData.map((item: any) =>
              item.id === context.tempId ? realDocument : item
            ) as T[]
            queryClient.setQueryData(queryKey, updatedData)
          }
        })
      }

      // The subscription will handle the final sync with Firestore automatically
    },
  })
}

export function useUpdateSubCollectionDocument(collectionName: string, subCollection: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      parentDocId,
      id,
      data,
    }: {
      parentDocId: string
      id: string
      data: any
    }) => {
      const docRef = doc(firestoreDb, collectionName, parentDocId, subCollection, id)
      const updateData = { ...data, updated: Timestamp.fromDate(new Date()) }

      await updateDoc(docRef, updateData)
      return { id, ...updateData }
    },
    onMutate: async ({ parentDocId, id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })

      // Optimistically update all matching queries
      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.map((item: any) =>
            item.id === id ? { ...item, ...data } : item
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

export function useDeleteSubCollectionDocument(collectionName: string, subCollection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ parentDocId, id }: { parentDocId: string; id: string }) => {
      const docRef = doc(firestoreDb, collectionName, parentDocId, subCollection, id)
      await deleteDoc(docRef)
    },
    onMutate: async ({ parentDocId, id }) => {
      await queryClient.cancelQueries({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: [...firebaseKeys.collection(collectionName), parentDocId, subCollection],
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.filter((item: any) => item.id !== id)
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

export function useCreateUser() {
  const queryClient = useQueryClient()
  const collection = 'users'

  return useMutation({
    mutationFn: async (user: User) => {
      const docRef = doc(firestoreDb, collection, user.uid)
      await setDoc(docRef, { ...user })
      return { ...user }
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: firebaseKeys.collection(collection) })
      queryClient.setQueryData(firebaseKeys.doc(collection, user.uid), user)
    },
  })
}

export function useGetUser(uid: string) {
  const collection = 'users'
  return useQuery({
    queryKey: firebaseKeys.doc(collection, uid),
    queryFn: async (): Promise<User> => {
      const docRef = doc(firestoreDb, collection, uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('User does not exist')
      }

      return { uid: docSnap.id, ...docSnap.data() } as User
    },
    enabled: !!uid,
    // Keep user data fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Cache user data for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Don't refetch on window focus
    refetchOnWindowFocus: true,
    // Don't refetch on mount if data is fresh
    refetchOnMount: true,
  })
}

export function useUpdateDocument(collection: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const docRef = doc(firestoreDb, collection, id)
      const updateData = { ...data, updated: Timestamp.fromDate(new Date()) }

      await updateDoc(docRef, updateData)
      return { id, ...updateData }
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: firebaseKeys.doc(collection, id) })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(firebaseKeys.doc(collection, id))

      // Optimistically update to the new value
      queryClient.setQueryData(firebaseKeys.doc(collection, id), (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(firebaseKeys.doc(collection, variables.id), context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: firebaseKeys.collection(collection) })
    },
  })
}

export function useDocumentSubscription(collection: string, id: string) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: firebaseKeys.doc(collection, id),
    queryFn: () => {
      // This won't actually be called due to staleTime: Infinity
      return Promise.resolve(null)
    },
    staleTime: Infinity,
    enabled: !!id,
  })

  useEffect(() => {
    if (!id) return

    const docRef = doc(firestoreDb, collection, id)

    unsubscribeRef.current = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        queryClient.setQueryData(firebaseKeys.doc(collection, id), { id: doc.id, ...doc.data() })
      }
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [id, collection, queryClient])

  return query
}

export function useSubCollectionSubscription<T>(
  collectionName: string,
  subCollectionName: string,
  parentDocId: string,
  constraints?: QueryConstraint[]
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queryClient = useQueryClient()

  // Memoize queryKey to ensure stable reference
  const queryKey = useMemo(
    () => [...firebaseKeys.collection(collectionName), parentDocId, subCollectionName, constraints],
    [collectionName, parentDocId, subCollectionName, constraints]
  )

  const queryResult = useQuery<T>({
    queryKey,
    queryFn: () => {
      // This won't actually be called due to staleTime: Infinity
      return Promise.resolve([] as T)
    },
    staleTime: Infinity,
    enabled: !!parentDocId,
  })

  useEffect(() => {
    if (!parentDocId) return

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    const subCollectionRef = collection(firestoreDb, collectionName, parentDocId, subCollectionName)

    const firestoreQuery = constraints?.length
      ? query(subCollectionRef, ...constraints)
      : subCollectionRef

    unsubscribeRef.current = onSnapshot(
      firestoreQuery,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[]
        // Use setQueryData with the exact queryKey to trigger re-renders
        queryClient.setQueryData(queryKey, docs)
      },
      (error) => {
        console.error('Error in subcollection subscription:', error)
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [parentDocId, collectionName, subCollectionName, queryClient, queryKey])

  return queryResult
}
