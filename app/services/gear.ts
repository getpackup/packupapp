import { type QueryObserverOptions, useQuery } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, query, type QueryConstraint } from 'firebase/firestore'

import { firestoreDb } from '~/firebase/config'
import type { GearItem } from '~/types/GearItem'

export const gearKeys = {
  gear: (constraints: QueryConstraint[]) => ['gear', ...constraints] as const,
  gearCloset: (userId: string) => ['gear-closet', userId] as const,
  // byId: (gearId: string) => [...gearKeys.gearCloset([]), id] as const,
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
    // Keep trip data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Cache trip data for 5 minutes
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
  queryOptions?: Omit<QueryObserverOptions<GearItem[], Error>, 'queryKey' | 'queryFn'>
}) {
  return useQuery<GearItem[], Error>({
    queryKey: gearKeys.gearCloset(userId),
    queryFn: async (): Promise<GearItem[]> => {
      // Get a master gear list
      const gearCollectionRef = collection(firestoreDb, 'gear')
      const gearQuery = query(gearCollectionRef)
      const gearSnapshot = await getDocs(gearQuery)
      const gear: Array<GearItem> = gearSnapshot.docs.map((doc) => {
        return doc.data() as GearItem
      })

      const gcDocRef = doc(firestoreDb, 'gear-closet', userId)
      const docSnap = await getDoc(gcDocRef)

      if (!docSnap.exists()) {
        console.error(`Gear closet does not exist for ${userId}`)
        return []
      }

      const { removals } = docSnap.data()

      const filteredList: Array<GearItem> = gear.filter((i: GearItem) => {
        // Match gear item to participating categories
        const keys = Object.keys(i)
        const participatingCategories = keys.filter(k => (i as Record<string, any>)[k] === true)

        // Remove items marked with "removals"
        return !removals.includes(i.id) && participatingCategories.length > 0
      })

      // Add "additions" gear
      const additionsSubCollectionRef = collection(firestoreDb, 'gear-closet', userId, 'additions')
      const additionsQuery = query(additionsSubCollectionRef)
      const additionsSnapshot = await getDocs(additionsQuery)
      const additions: Array<GearItem> = additionsSnapshot.docs.map(doc => {
        return doc.data() as GearItem
      })

      // Voilà
      return [...filteredList, ...additions]
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