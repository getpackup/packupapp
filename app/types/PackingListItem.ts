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
  gearItemId?: string
  gearOwnerId?: string
  gearSource?: 'master' | 'custom'
  id: string
  isEssential: boolean
  isPacked: boolean
  isSponsored?: boolean
  name: string
  overrides?: {
    description?: string
    weight?: string
    weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  }
  packedBy: PackedByUserType[]
  quantity: number
  tags?: string[]
  updated?: Timestamp
  weight?: string
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  labels?: ItemLabel[]
}
