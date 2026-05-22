import type { Timestamp } from 'firebase/firestore'

import type { EmergencyContact } from './EmergencyContact'

export type WeightUnitPreferenceType = 'g' | 'kg' | 'oz' | 'lb'

export type User = {
  bio?: string
  displayName: string
  email: string
  isAnonymous?: boolean
  emergencyContacts?: EmergencyContact[]
  isAdmin?: boolean
  location?: string
  photoURL?: string
  profileHeaderImage?: string
  searchableIndex?: Array<{ [key: string]: boolean }>
  uid: string
  id: string
  username: string
  website?: string
  lastUpdated?: Timestamp
  createdAt?: Timestamp
  fcmTokens?: string[]
  tagCounts?: Record<string, number>
  preferences?: {
    theme?: 'light' | 'dark'
    hasSeenPackingListTour?: boolean
    hasDismissedFernwoodAd?: Timestamp
    safetyItineraryEnabled?: boolean
    friendRequestEmailEnabled?: boolean
    temperatureUnit?: 'celsius' | 'fahrenheit'
    weightUnit?: WeightUnitPreferenceType
  }
}
