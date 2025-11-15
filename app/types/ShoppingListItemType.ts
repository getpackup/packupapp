import type { Timestamp } from 'firebase/firestore'

export type ShoppingListItemPriority = 'no priority' | 'high' | 'medium' | 'low'

export type ShoppingListItemType = {
  id: string
  userId: string
  tripId: string
  itemName: string
  quantity: number
  notes: string
  estimatedPrice: string | null
  actualPrice: string | null
  isPurchased: boolean
  purchasedAt: Timestamp | null
  created: Timestamp
  updated: Timestamp | null
  priority: ShoppingListItemPriority
  store: string | null // Where they plan to buy it. Stores are saved on the user's profile.
  sourcePackingListItemId: string | null // Link back to original packing list item
}
