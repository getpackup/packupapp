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
  query,
  type QueryConstraint,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import type { ShoppingListItem } from '~/types/ShoppingListItem'

export const shoppingListKeys = {
  all: (constraints: QueryConstraint[]) => ['shopping-list', ...constraints] as const,
  byId: (shoppingListItemId: string) => [...shoppingListKeys.all([]), shoppingListItemId] as const,
}

export function useShoppingListQuery({
  constraints,
  queryOptions,
}: {
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<ShoppingListItem[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<ShoppingListItem[], Error>({
    queryKey: shoppingListKeys.all(constraints),
    queryFn: async (): Promise<ShoppingListItem[]> => {
      const shoppingListCollectionRef = collection(firestoreDb, 'shopping-list')

      if (constraints?.length) {
        const q = query(shoppingListCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
          const data = doc.data() as ShoppingListItem
          return data
        })
      }

      const querySnapshot = await getDocs(shoppingListCollectionRef)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as ShoppingListItem
        return data
      })
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useShoppingListItemByIdQuery({
  shoppingListItemId,
}: {
  shoppingListItemId: string
}) {
  return useQuery<ShoppingListItem, Error>({
    queryKey: shoppingListKeys.byId(shoppingListItemId),
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'shopping-list', shoppingListItemId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Shopping list item does not exist')
      }

      return { id: docSnap.id, ...docSnap.data() } as ShoppingListItem
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useUpdateShoppingListItem(shoppingListItemId: string) {
  const queryClient = useQueryClient()
  const shoppingListItemQueryKey = shoppingListKeys.byId(shoppingListItemId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<ShoppingListItem> }) => {
      const docRef = doc(firestoreDb, 'shopping-list', shoppingListItemId)
      const updateData = { ...data, updated: Timestamp.fromDate(new Date()) }

      await updateDoc(docRef, updateData)
      return { ...updateData }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListItemQueryKey })

      const previousData = queryClient.getQueryData(shoppingListItemQueryKey)

      // Optimistically update to the new value
      queryClient.setQueryData(shoppingListItemQueryKey, (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousData }
    },
    onSuccess: () => {
      toast.success(`Shopping list item updated successfully`)
      // trackEvent('Shopping list item Updated Successfully', {
      //   shoppingListItemId: id,
      //   ...previousShoppingListItemData,
      //   ...data,
      // })
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(shoppingListItemQueryKey, context.previousData)
      }
      toast.error(err.message)
      // trackEvent(`Shopping list item Update Failure`, {
      // shoppingListItemId: id,
      //   ...previousShoppingListItemData,
      // error: err,
      // })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListItemQueryKey })
    },
  })
}

export function useDeleteShoppingListItem(shoppingListItemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const docRef = doc(firestoreDb, 'shopping-list', shoppingListItemId)
      await deleteDoc(docRef)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: shoppingListKeys.byId(shoppingListItemId),
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: shoppingListKeys.byId(shoppingListItemId),
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.filter((item: any) => item.id !== shoppingListItemId)
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
