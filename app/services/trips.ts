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
  writeBatch,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { z } from 'zod'

import { firestoreDb } from '~/firebase/config'
import { assemblePackingListItems } from '~/lib/packingList'
import type { ActivityTypes, GearClosetItem, GearItem } from '~/types/GearItem'
import type { PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { TripMember } from '~/types/TripMember'
import type { User } from '~/types/User'

// Firestore docs are read as `any`; tripMembers is required on Trip but a doc can
// transiently lack it (e.g. reading a just-created trip). Normalize here so every
// consumer can trust the required type instead of guarding at each call site.
const tripMembersSchema = z.record(z.string(), z.custom<TripMember>()).catch({})

export { tripKeys } from './tripKeys'

export function useTripsQuery({
  constraints,
  queryOptions,
}: {
  constraints: QueryConstraint[]
  queryOptions?: Omit<QueryObserverOptions<Trip[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<Trip[], Error>({
    queryKey: ['trips', ...constraints],
    queryFn: async (): Promise<Trip[]> => {
      const tripsCollectionRef = collection(firestoreDb, 'trips')

      if (constraints?.length) {
        const q = query(tripsCollectionRef, ...constraints)
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => doc.data() as Trip)
      }

      const querySnapshot = await getDocs(tripsCollectionRef)
      return querySnapshot.docs.map((doc) => doc.data() as Trip)
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useTripByIdQuery({ tripId }: { tripId: string }) {
  return useQuery<Trip, Error>({
    queryKey: ['trips', tripId],
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'trips', tripId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Trip does not exist')
      }

      const data = docSnap.data()
      return {
        tripId: docSnap.id,
        ...data,
        tripMembers: tripMembersSchema.parse(data.tripMembers),
      } as Trip
    },
    staleTime: 5 * 60 * 1000,
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
    queryKey: ['trips', tripId, 'trip-members', ...constraints],
    queryFn: async (): Promise<User[]> => {
      const usersCollectionRef = collection(firestoreDb, 'users')
      const q = query(usersCollectionRef, ...constraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]
    },
    staleTime: 2 * 60 * 1000,
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
    queryKey: ['trips', tripId, 'packing-list', ...constraints],
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
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...queryOptions,
  })
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient()
  const tripQueryKey = ['trips', tripId] as const

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
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tripQueryKey, context.previousData)
      }
      toast.error(err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: tripQueryKey })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'trip-members'] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId }: { tripId: string }) => {
      const docRef = doc(firestoreDb, 'trips', tripId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip deleted')
    },
    onError: () => {
      toast.error('Failed to delete trip')
    },
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation<
    Trip,
    Error,
    { data: Omit<Trip, 'id' | 'tripId'>; tripMembers: Record<string, TripMember> }
  >({
    mutationFn: async ({ data, tripMembers }) => {
      const tripsCollectionRef = collection(firestoreDb, 'trips')
      const docRef = doc(tripsCollectionRef)
      const tripData = {
        ...data,
        id: docRef.id,
        tripId: docRef.id,
        tripMembers,
        created: Timestamp.now(),
        updated: Timestamp.now(),
      }
      await setDoc(docRef, tripData)
      return tripData as Trip
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
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
      const docRef = await addDoc(subCollectionRef, { ...data })
      return { ...data, id: docRef.id }
    },
    onMutate: async ({ tripId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'packing-list'] })

      const previousQueries = queryClient.getQueriesData({
        queryKey: ['trips', tripId, 'packing-list'],
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
        queryKey: ['trips', variables.tripId, 'packing-list'],
      })

      if (context?.tempId) {
        previousQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            queryClient.setQueryData(
              queryKey,
              queryData.map((item: any) =>
                item.id === context.tempId ? realDocument : item
              ) as PackingListItem[]
            )
          }
        })
      }
    },
  })
}

export function useUpdatePackingListItem({ tripId }: { tripId: string }) {
  const queryClient = useQueryClient()
  const packingListItemQueryKey = ['trips', tripId, 'packing-list'] as const

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
      await queryClient.cancelQueries({ queryKey: packingListItemQueryKey })

      const previousQueries = queryClient.getQueriesData({
        queryKey: packingListItemQueryKey,
      })

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
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
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
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'packing-list'] })

      const previousQueries = queryClient.getQueriesData({
        queryKey: ['trips', tripId, 'packing-list'],
      })

      previousQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          queryClient.setQueryData(
            queryKey,
            queryData.filter((item: any) => item.id !== packingListItemId)
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

export function useGeneratePackingList() {
  const queryClient = useQueryClient()

  return useMutation<
    PackingListItem[],
    Error,
    {
      tripId: string
      activityKeys: Array<keyof ActivityTypes>
      userId: string
      customTagNames?: string[]
    }
  >({
    mutationFn: async ({ tripId, activityKeys, userId, customTagNames = [] }) => {
      const [masterSnap, closetSnap, additionsSnap, existingSnap, tripSnap] = await Promise.all([
        getDocs(collection(firestoreDb, 'gear')),
        getDoc(doc(firestoreDb, 'gear-closet', userId)),
        getDocs(collection(firestoreDb, 'gear-closet', userId, 'additions')),
        getDocs(collection(firestoreDb, 'trips', tripId, 'packing-list')),
        getDoc(doc(firestoreDb, 'trips', tripId)),
      ])

      const masterItems = masterSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as GearItem)
      const closetData = closetSnap.data()
      const removals: string[] = closetData?.removals ?? []
      const customItems = additionsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as GearClosetItem
      )
      const existingGearItemIds = new Set<string>(
        existingSnap.docs
          .map((d) => d.data().gearItemId as string | undefined)
          .filter((id): id is string => !!id)
      )
      const existingTripTags = (tripSnap.data() as Trip | undefined)?.tags ?? []

      const { itemData, mergedTags, personalTags } = assemblePackingListItems({
        masterItems,
        customItems,
        activityKeys,
        removals,
        existingGearItemIds,
        customTagNames,
        userId,
        existingTripTags,
      })

      if (itemData.length === 0) return []

      const batch = writeBatch(firestoreDb)
      const now = Timestamp.now()
      const createdItems: PackingListItem[] = []

      for (const data of itemData) {
        const docRef = doc(collection(firestoreDb, 'trips', tripId, 'packing-list'))
        const fullItem = { ...data, created: now }
        batch.set(docRef, fullItem)
        createdItems.push({ ...fullItem, id: docRef.id })
      }

      batch.update(doc(firestoreDb, 'trips', tripId), {
        tags: mergedTags,
        [`tripMembers.${userId}.personalTags`]: personalTags,
        updated: now,
      })
      await batch.commit()
      return createdItems
    },
    onMutate: async ({ tripId }) => {
      await queryClient.cancelQueries({ queryKey: ['trips', tripId, 'packing-list'] })
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'packing-list'] })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
    },
    onError: (err) => {
      console.error('Generate packing list error:', err)
      toast.error('Failed to generate packing list')
    },
  })
}
