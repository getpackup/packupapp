import type { Timestamp } from 'firebase/firestore'

import type { TripMember } from './TripMember'

export type Trip = {
  archived?: boolean
  collapsedCategories?: { [key: string]: string[] }
  created?: Timestamp
  description: string
  endDate: Timestamp
  headerImage?: string
  id: string
  lat: number
  lng: number
  name: string
  owner: string
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  startDate: Timestamp
  startingPoint: string
  tags: Array<string>
  timezoneOffset: number
  tripId: string
  tripLength: number
  tripMembers: { [key: string]: TripMember } // note keys are UIDs, but uid is also in object. Use Object.(keys/values) everywhere to get what you need
  updated?: Timestamp
}
