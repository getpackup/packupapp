import type { Timestamp } from 'firebase/firestore'

import type { TripMember } from './TripMember'

export type Trip = {
  id: string
  owner: string
  tripId: string
  name: string
  description: string
  startingPoint: string
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  startDate: Timestamp
  endDate: Timestamp
  timezoneOffset: number
  lat: number
  lng: number
  created?: Timestamp
  updated?: Timestamp
  tripMembers: { [key: string]: TripMember } // note keys are UIDs, but uid is also in object. Use Object.(keys/values) everywhere to get what you need
  tags: Array<string>
  tripLength: number
  headerImage?: string
  archived?: boolean
  collapsedCategories?: { [key: string]: string[] }
}
