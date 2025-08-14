import type { Timestamp } from 'firebase/firestore'

export type User = {
  bio?: string
  displayName: string
  email: string
  emergencyContacts?: Array<{ name: string; email: string; phoneNumber: string }>
  isAdmin?: boolean
  location?: string
  photoURL?: string
  profileHeaderImage?: string
  searchableIndex?: Array<{ [key: string]: boolean }>
  uid: string
  username: string
  website?: string
  lastUpdated?: Timestamp
  createdAt?: Timestamp
  preferences?: {
    theme?: 'light' | 'dark'
    hasSeenPackingListTour?: boolean
    hasDismissedFernwoodAd?: Timestamp
  }
}
