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
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

const shoppingListRootKey = ['shopping-list'] as const

export const shoppingListKeys = {
  root: shoppingListRootKey,
  all: (constraints: QueryConstraint[]) => [...shoppingListRootKey, ...constraints] as const,
  byId: (shoppingListItemId: string) => [...shoppingListRootKey, shoppingListItemId] as const,
}

export function useShoppingListQuery({
  constraints,
  queryOptions,
}: {
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<ShoppingListItemType[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<ShoppingListItemType[], Error>({
    queryKey: shoppingListKeys.all(constraints),
    queryFn: async (): Promise<ShoppingListItemType[]> => {
      const shoppingListCollectionRef = collection(firestoreDb, 'shopping-list')

      if (constraints?.length) {
        const q = query(shoppingListCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return { id: doc.id, ...data } as ShoppingListItemType
        })
      }

      const querySnapshot = await getDocs(shoppingListCollectionRef)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return { id: doc.id, ...data } as ShoppingListItemType
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
  return useQuery<ShoppingListItemType, Error>({
    queryKey: shoppingListKeys.byId(shoppingListItemId),
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'shopping-list', shoppingListItemId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Shopping list item does not exist')
      }

      return { id: docSnap.id, ...docSnap.data() } as ShoppingListItemType
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useCreateShoppingListItem() {
  const queryClient = useQueryClient()

  return useMutation<
    ShoppingListItemType,
    Error,
    { data: Omit<ShoppingListItemType, 'id'> },
    { previousQueries: Array<[unknown, unknown]>; tempId: string }
  >({
    mutationFn: async ({ data }) => {
      const collectionRef = collection(firestoreDb, 'shopping-list')
      const documentData = { ...data }
      const docRef = await addDoc(collectionRef, documentData)
      return { ...documentData, id: docRef.id }
    },
    onMutate: async ({ data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: shoppingListKeys.root,
      })

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: shoppingListKeys.root,
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
      toast.success(`${variables.data.itemName} successfully added to shopping list`)
      // Replace temporary document with real one in all queries
      // This ensures consistency if subscription hasn't updated yet
      const previousQueries = queryClient.getQueriesData({
        queryKey: shoppingListKeys.root,
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            const updatedData = queryData.map((item: any) =>
              item.id === context.tempId ? realDocument : item
            ) as ShoppingListItemType[]
            queryClient.setQueryData(queryKey, updatedData)
          }
        })
      }
    },
  })
}

export function useUpdateShoppingListItem() {
  const queryClient = useQueryClient()
  const shoppingListItemQueryKey = shoppingListKeys.root

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<ShoppingListItemType> }) => {
      const docRef = doc(firestoreDb, 'shopping-list', data.id ?? '')
      const updateTimestamp = Timestamp.fromDate(new Date())
      const updateData = { ...data, updated: updateTimestamp }

      await updateDoc(docRef, updateData)
      return { id: data.id, ...updateData }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListItemQueryKey })

      const previousData = queryClient.getQueryData(shoppingListItemQueryKey)
      const updateTimestamp = Timestamp.fromDate(new Date())

      // Optimistically update to the new value
      queryClient.setQueryData(
        shoppingListItemQueryKey,
        (old: ShoppingListItemType | undefined) => ({
          ...(old ?? { id: data.id ?? '' }),
          ...data,
          updated: updateTimestamp,
        })
      )

      return { previousData }
    },
    onSuccess: () => {
      // toast.success(`Shopping list item updated successfully`)
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

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string }) => {
      const docRef = doc(firestoreDb, 'shopping-list', data.id ?? '')
      await deleteDoc(docRef)
    },
    onMutate: async (data: { id: string }) => {
      await queryClient.cancelQueries({
        queryKey: shoppingListKeys.root,
      })
      const previousQueries = queryClient.getQueriesData({
        queryKey: shoppingListKeys.root,
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const updatedData = queryData.filter((item: any) => item.id !== data.id)
          queryClient.setQueryData(queryKey, updatedData)
        } else if (queryData && (queryData as ShoppingListItemType).id === data.id) {
          queryClient.setQueryData(queryKey, undefined)
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
