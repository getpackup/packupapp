import { useMemo, useState } from 'react'

import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

type PurchaseState = 'unpurchased' | 'purchased' | 'all'
type SortBy = 'trip' | 'priority' | 'store'

export function useShoppingListFilters(items: ShoppingListItemType[]) {
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('unpurchased')
  const [sortBy, setSortBy] = useState<SortBy>('trip')
  const [activeStores, setActiveStores] = useState<string[]>([])

  const storeChips = useMemo(() => {
    const seen = new Map<string, string>()
    let hasNoStore = false

    for (const item of items) {
      if (item.store === null) {
        hasNoStore = true
      } else {
        const lower = item.store.toLowerCase()
        if (!seen.has(lower)) {
          seen.set(lower, item.store)
        }
      }
    }

    const named = Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
    if (named.length > 0 && hasNoStore) named.push('No store')
    return named
  }, [items])

  return {
    purchaseState,
    setPurchaseState,
    sortBy,
    setSortBy,
    activeStores,
    setActiveStores,
    storeChips,
  }
}
