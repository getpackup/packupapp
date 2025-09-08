import {
  type QueryObserverOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QueryConstraint,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useRef } from 'react'

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

export const useSubCollection = <T>(
  collectionName: string,
  subCollectionName: string,
  parentDocId: string,
  constraints?: QueryConstraint[],
  queryOptions?: Partial<QueryObserverOptions>
) => {
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
      await setDoc(docRef, { ...data, createdAt: new Date() })
      return { id, ...data }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: firebaseKeys.collection(collection) })
      queryClient.setQueryData(firebaseKeys.doc(collection, data.id), data)
    },
  })
}

export function useCreateSubCollectionDocument(collection: string, subCollection: string) {
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
      const docRef = doc(firestoreDb, collection, parentDocId, subCollection, id)
      await setDoc(docRef, { ...data, createdAt: new Date() })
      return { id, ...data }
    },
    onSuccess: (data, variables) => {
      // Invalidate the subcollection query
      queryClient.invalidateQueries({
        queryKey: [...firebaseKeys.collection(collection), variables.parentDocId, subCollection],
      })
      // Set the new document data
      queryClient.setQueryData(
        [...firebaseKeys.collection(collection), variables.parentDocId, subCollection, data.id],
        data
      )
    },
  })
}

export function useUpdateSubCollectionDocument(collection: string, subCollection: string) {
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
      const docRef = doc(firestoreDb, collection, parentDocId, subCollection, id)
      const updateData = { ...data, updatedAt: new Date() }

      await updateDoc(docRef, updateData)
      return { id, ...updateData }
    },
    onMutate: async ({ parentDocId, id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...firebaseKeys.collection(collection), parentDocId, subCollection],
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: [...firebaseKeys.collection(collection), parentDocId, subCollection],
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
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...firebaseKeys.collection(collection), variables.parentDocId, subCollection],
      })
    },
  })
}

export function useDeleteSubCollectionDocument(collection: string, subCollection: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ parentDocId, id }: { parentDocId: string; id: string }) => {
      const docRef = doc(firestoreDb, collection, parentDocId, subCollection, id)
      await deleteDoc(docRef)
    },
    onMutate: async ({ parentDocId, id }) => {
      await queryClient.cancelQueries({
        queryKey: [...firebaseKeys.collection(collection), parentDocId, subCollection],
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: [...firebaseKeys.collection(collection), parentDocId, subCollection],
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...firebaseKeys.collection(collection), variables.parentDocId, subCollection],
      })
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
      const updateData = { ...data, updatedAt: new Date() }

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
