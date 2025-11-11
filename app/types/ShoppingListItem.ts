import type { Timestamp } from 'firebase/firestore'

export type ShoppingListItemPriority = 'high' | 'medium' | 'low'

export type ShoppingListItem = {
  id: string
  userId: string
  tripId: string
  itemName: string
  neededBy: Timestamp
  category: string
  quantity: number
  notes: string
  estimatedPrice: number | null
  actualPrice: number | null
  isPurchased: boolean
  purchasedAt: Timestamp | null
  created: Timestamp
  updated: Timestamp | null
  priority: ShoppingListItemPriority
  store: string | null // Where they plan to buy it
  sourcePackingListItemId: string | null // Link back to original packing list item
}
