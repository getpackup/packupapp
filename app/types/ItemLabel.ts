export interface ItemLabel {
  id: string
  text: string
  color: string
}

export type FirestoreItemLabel = Omit<ItemLabel, 'id'>
