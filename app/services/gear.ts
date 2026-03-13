import {
  type QueryObserverOptions,
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
  query,
  type QueryConstraint,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import type { GearCloset } from '~/types/GearCloset'
import type { GearClosetItem, GearItem } from '~/types/GearItem'

export const gearKeys = {
  gear: (constraints: QueryConstraint[]) => ['gear', ...constraints] as const,
  gearCloset: (userId: string) => ['gear-closet', userId] as const,
  gearClosetAdditions: (userId: string) => ['gear-closet', userId, 'additions'] as const,
}

export function useGearQuery({
  constraints,
  queryOptions,
}: {
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<GearItem[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<GearItem[], Error>({
    queryKey: gearKeys.gear(constraints),
    queryFn: async (): Promise<GearItem[]> => {
      const gearCollectionRef = collection(firestoreDb, 'gear')

      if (constraints?.length) {
        const q = query(gearCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
          return doc.data() as GearItem
        })
      }

      const querySnapshot = await getDocs(gearCollectionRef)
      return querySnapshot.docs.map((doc) => {
        return doc.data() as GearItem
      })
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useGearClosetQuery({
  userId,
  queryOptions,
}: {
  userId: string
  queryOptions?: Omit<QueryObserverOptions<GearCloset, Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<GearCloset, Error>({
    queryKey: gearKeys.gearCloset(userId),
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'gear-closet', userId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error(`Gear closet does not exist for ${userId}`)
      }

      return { id: docSnap.id, ...docSnap.data() } as GearCloset
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useGearClosetAdditionsQuery({
  userId,
  queryOptions,
}: {
  userId: string
  queryOptions?: Omit<QueryObserverOptions<GearClosetItem[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<GearClosetItem[], Error>({
    queryKey: gearKeys.gearClosetAdditions(userId),
    queryFn: async (): Promise<GearClosetItem[]> => {
      const subCollectionRef = collection(firestoreDb, 'gear-closet', userId, 'additions')
      const querySnapshot = await getDocs(subCollectionRef)
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as GearClosetItem)
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useCreateGearClosetItem(userId: string) {
  const queryClient = useQueryClient()
  const additionsKey = gearKeys.gearClosetAdditions(userId)

  return useMutation<
    GearClosetItem,
    Error,
    { data: Omit<GearClosetItem, 'id'> },
    { previousQueries: Array<[unknown, unknown]>; tempId: string }
  >({
    mutationFn: async ({ data }) => {
      const subCollectionRef = collection(firestoreDb, 'gear-closet', userId, 'additions')
      const docRef = await addDoc(subCollectionRef, data)
      return { ...data, id: docRef.id }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: additionsKey })
      const previousQueries = queryClient.getQueriesData({ queryKey: additionsKey })
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticItem = { ...data, id: tempId }

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(queryKey, [...queryData, optimisticItem])
        }
      })

      return { previousQueries, tempId }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
      toast.error('Failed to add gear item')
    },
    onSuccess: (realItem, _variables, context) => {
      const queries = queryClient.getQueriesData({ queryKey: additionsKey })
      if (context?.tempId) {
        queries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            queryClient.setQueryData(
              queryKey,
              queryData.map((item: any) => (item.id === context.tempId ? realItem : item))
            )
          }
        })
      }
      toast.success('Gear item added')
    },
  })
}

export function useUpdateGearClosetItem(userId: string) {
  const queryClient = useQueryClient()
  const additionsKey = gearKeys.gearClosetAdditions(userId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<GearClosetItem> & { id: string } }) => {
      const { id, ...rest } = data
      const docRef = doc(firestoreDb, 'gear-closet', userId, 'additions', id)
      const updateData = { ...rest, updated: Timestamp.fromDate(new Date()) }
      await updateDoc(docRef, updateData)
      return { id, ...updateData }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: additionsKey })
      const previousQueries = queryClient.getQueriesData({ queryKey: additionsKey })
      const updateTimestamp = Timestamp.fromDate(new Date())

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(
            queryKey,
            queryData.map((item: any) =>
              item.id === data.id ? { ...item, ...data, updated: updateTimestamp } : item
            )
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
      toast.error('Failed to update gear item')
    },
    onSuccess: () => {
      toast.success('Gear item updated')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: additionsKey })
    },
  })
}

export function useDeleteGearClosetItem(userId: string) {
  const queryClient = useQueryClient()
  const additionsKey = gearKeys.gearClosetAdditions(userId)

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const docRef = doc(firestoreDb, 'gear-closet', userId, 'additions', itemId)
      await deleteDoc(docRef)
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: additionsKey })
      const previousQueries = queryClient.getQueriesData({ queryKey: additionsKey })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(
            queryKey,
            queryData.filter((item: any) => item.id !== itemId)
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], queryData)
        })
      }
      toast.error('Failed to delete gear item')
    },
    onSuccess: () => {
      toast.success('Gear item deleted')
    },
  })
}

export function useUpdateGearClosetCategories(userId: string) {
  const queryClient = useQueryClient()
  const closetKey = gearKeys.gearCloset(userId)

  return useMutation({
    mutationFn: async ({ categories }: { categories: string[] }) => {
      const docRef = doc(firestoreDb, 'gear-closet', userId)
      await setDoc(docRef, { categories }, { merge: true })
      return categories
    },
    onMutate: async ({ categories }) => {
      await queryClient.cancelQueries({ queryKey: closetKey })
      const previousData = queryClient.getQueryData(closetKey)

      queryClient.setQueryData(closetKey, (old: GearCloset | undefined) => ({
        ...(old ?? { id: userId, owner: userId, removals: [] }),
        categories,
      }))

      return { previousData }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(closetKey, context.previousData)
      }
      toast.error('Failed to update categories')
    },
    onSuccess: () => {
      toast.success('Categories updated')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: closetKey })
    },
  })
}

export function useRemoveGearItem(userId: string) {
  const queryClient = useQueryClient()
  const closetKey = gearKeys.gearCloset(userId)

  return useMutation({
    mutationFn: async ({ gearItemId }: { gearItemId: string }) => {
      const docRef = doc(firestoreDb, 'gear-closet', userId)
      const docSnap = await getDoc(docRef)
      const current = docSnap.data() as GearCloset | undefined
      const removals = [...(current?.removals ?? []), gearItemId]
      await setDoc(docRef, { removals }, { merge: true })
      return removals
    },
    onMutate: async ({ gearItemId }) => {
      await queryClient.cancelQueries({ queryKey: closetKey })
      const previousData = queryClient.getQueryData(closetKey)

      queryClient.setQueryData(closetKey, (old: GearCloset | undefined) => ({
        ...(old ?? { id: userId, owner: userId, categories: [] }),
        removals: [...(old?.removals ?? []), gearItemId],
      }))

      return { previousData }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(closetKey, context.previousData)
      }
      toast.error('Failed to hide gear item')
    },
    onSuccess: () => {
      toast.success('Item hidden from gear closet')
    },
  })
}

export function useRestoreGearItem(userId: string) {
  const queryClient = useQueryClient()
  const closetKey = gearKeys.gearCloset(userId)

  return useMutation({
    mutationFn: async ({ gearItemId }: { gearItemId: string }) => {
      const docRef = doc(firestoreDb, 'gear-closet', userId)
      const docSnap = await getDoc(docRef)
      const current = docSnap.data() as GearCloset | undefined
      const removals = (current?.removals ?? []).filter((id) => id !== gearItemId)
      await setDoc(docRef, { removals }, { merge: true })
      return removals
    },
    onMutate: async ({ gearItemId }) => {
      await queryClient.cancelQueries({ queryKey: closetKey })
      const previousData = queryClient.getQueryData(closetKey)

      queryClient.setQueryData(closetKey, (old: GearCloset | undefined) => ({
        ...(old ?? { id: userId, owner: userId, categories: [] }),
        removals: (old?.removals ?? []).filter((id) => id !== gearItemId),
      }))

      return { previousData }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(closetKey, context.previousData)
      }
      toast.error('Failed to restore gear item')
    },
    onSuccess: () => {
      toast.success('Item restored to gear closet')
    },
  })
}
