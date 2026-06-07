import { useMemo } from 'react'

import type { ShoppingListItemType } from '~/types/ShoppingListItemType'
import type { Trip } from '~/types/Trip'

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, 'no priority': 3 }

type PurchaseState = 'unpurchased' | 'purchased' | 'all'
type SortBy = 'trip' | 'priority' | 'store'

export interface ShoppingListViewItem {
  item: ShoppingListItemType
  trip: Trip | undefined
}

export function useShoppingListView({
  items,
  trips,
  purchaseState,
  sortBy,
  activeStores,
}: {
  items: ShoppingListItemType[]
  trips: Trip[]
  purchaseState: PurchaseState
  sortBy: SortBy
  activeStores: string[]
}): ShoppingListViewItem[] {
  return useMemo(() => {
    const tripMap = new Map(trips.map((t) => [t.id, t]))

    let filtered = items.filter((item) => {
      if (purchaseState === 'unpurchased' && item.isPurchased) return false
      if (purchaseState === 'purchased' && !item.isPurchased) return false
      return true
    })

    if (activeStores.length > 0) {
      filtered = filtered.filter((item) =>
        activeStores.some((store) => (store === 'No store' ? item.store === null : item.store === store))
      )
    }

    const enriched: ShoppingListViewItem[] = filtered.map((item) => ({
      item,
      trip: tripMap.get(item.tripId),
    }))

    enriched.sort((a, b) => {
      const aStart = a.trip?.startDate.toMillis() ?? 0
      const bStart = b.trip?.startDate.toMillis() ?? 0
      const aPriority = PRIORITY_ORDER[a.item.priority] ?? 3
      const bPriority = PRIORITY_ORDER[b.item.priority] ?? 3

      if (sortBy === 'trip') {
        if (aStart !== bStart) return aStart - bStart
        return aPriority - bPriority
      }

      if (sortBy === 'priority') {
        if (aPriority !== bPriority) return aPriority - bPriority
        return aStart - bStart
      }

      // sortBy === 'store'
      const aStore = a.item.store
      const bStore = b.item.store
      if (aStore === bStore) return aStart - bStart
      if (aStore === null) return 1
      if (bStore === null) return -1
      return aStore.localeCompare(bStore)
    })

    return enriched
  }, [items, trips, purchaseState, sortBy, activeStores])
}
