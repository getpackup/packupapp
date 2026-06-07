import type { Timestamp } from 'firebase/firestore'

import type { EmergencyContact } from './EmergencyContact'

export type WeightUnitPreferenceType = 'g' | 'kg' | 'oz' | 'lb'

export type User = {
  bio?: string
  displayName: string
  email: string
  isAnonymous?: boolean
  plan?: 'free' | 'pro'
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
  usernameLastUpdated?: Timestamp
  fcmTokens?: string[]
  tagCounts?: Record<string, number>
  preferences?: {
    chatNotificationsEnabled?: boolean
    friendRequestEmailEnabled?: boolean
    hasDismissedFernwoodAd?: Timestamp
    hasSeenPackingListTour?: boolean
    safetyItineraryEnabled?: boolean
    temperatureUnit?: 'celsius' | 'fahrenheit'
    theme?: 'light' | 'dark'
    weightUnit?: WeightUnitPreferenceType
  }
}
