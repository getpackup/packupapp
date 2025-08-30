import type { Timestamp } from 'firebase/firestore'

import type { ItemLabel } from './ItemLabel'

export type PackedByUserType = {
  uid: string
  quantity: number
  isShared: boolean
}

export type PackingListItem = {
  category: string
  created: Timestamp
  description?: string
  id: string
  isEssential: boolean
  isPacked: boolean
  isSponsored?: boolean
  name: string
  packedBy: PackedByUserType[]
  quantity: number
  updated?: Timestamp
  weight?: string
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  labels?: ItemLabel[]
}
