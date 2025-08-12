import { Query, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  type CollectionReference,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useRef } from 'react'

import { firestoreDb } from '~/firebase/config'

export const firebaseKeys = {
  all: ['firebase'] as const,
  docs: () => [...firebaseKeys.all, 'docs'] as const,
  doc: (collection: string, id: string) => [...firebaseKeys.docs(), collection, id] as const,
  collections: () => [...firebaseKeys.all, 'collections'] as const,
  collection: (name: string, filters?: any) =>
    [...firebaseKeys.collections(), name, filters] as const,
}

export function useDocument(collection: string, id: string) {
  return useQuery({
    queryKey: firebaseKeys.doc(collection, id),
    queryFn: async () => {
      const docRef = doc(firestoreDb, collection, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Document does not exist')
      }

      return { id: docSnap.id, ...docSnap.data() }
    },
  })
}

export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints?: any[]
) {
  return useQuery({
    queryKey: firebaseKeys.collection(collectionName, constraints),
    queryFn: async () => {
      const collectionRef = collection(firestoreDb, collectionName)

      if (constraints?.length) {
        const q = query(collectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[]
      }

      const querySnapshot = await getDocs(collectionRef)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[]
    },
  })
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
