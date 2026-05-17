import type { Timestamp } from 'firebase/firestore'

export type ActivityTypes = {
  airplane: boolean
  baby: boolean
  backcountryThreeSeason: boolean
  backcountryWinter: boolean
  backpacking: boolean
  basicHut: boolean
  bikepacking: boolean
  biking: boolean
  bivy: boolean
  boat: boolean
  bouldering: boolean
  bus: boolean
  car: boolean
  carCamp: boolean
  carCamping: boolean
  casual: boolean
  crossCountrySkiing: boolean
  dayTrip: boolean
  essential: boolean
  fishing: boolean
  hiking: boolean
  hostel: boolean
  hotel: boolean
  iceClimbing: boolean
  international: boolean
  kids: boolean
  motorcycle: boolean
  mountainBiking: boolean
  mountaineering: boolean
  multidayTrip: boolean
  paddling: boolean
  pets: boolean
  photography: boolean
  resort: boolean
  resortSkiing: boolean
  servicedHut: boolean
  skiTouring: boolean
  snowboarding: boolean
  snowshoeing: boolean
  sportClimbing: boolean
  surfing: boolean
  tent: boolean
  touring: boolean
  tradClimbing: boolean
  trailRunning: boolean
  train: boolean
}

// TODO: figure out how to not need to repeat this list in ActivityTypes type
export const activityTypesList: Array<keyof ActivityTypes> = [
  'airplane',
  'baby',
  'backcountryThreeSeason',
  'backcountryWinter',
  'backpacking',
  'basicHut',
  'bikepacking',
  'biking',
  'bivy',
  'boat',
  'bouldering',
  'bus',
  'car',
  'carCamp',
  'carCamping',
  'casual',
  'crossCountrySkiing',
  'dayTrip',
  'essential',
  'fishing',
  'hiking',
  'hostel',
  'hotel',
  'iceClimbing',
  'international',
  'kids',
  'motorcycle',
  'mountainBiking',
  'multidayTrip',
  'paddling',
  'pets',
  'photography',
  'resort',
  'resortSkiing',
  'servicedHut',
  'skiTouring',
  'snowboarding',
  'snowshoeing',
  'sportClimbing',
  'surfing',
  'tent',
  'touring',
  'tradClimbing',
  'trailRunning',
  'train',
]

// todo commonize this with gearCloset.ts
export type GearItem = {
  id: string
  name: string
  category?: string
  tags?: string[]
  created?: Timestamp
  updated?: Timestamp
  essential: boolean
  isCustomGearItem?: boolean
  weight?: string
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  description?: string
  quantity?: number
} & ActivityTypes

export type GearClosetItem = {
  id: string
  name: string
  tags: string[]
  created?: Timestamp
  updated?: Timestamp
  essential: boolean
  weight?: string
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  description?: string
  quantity?: number
}

export type GearListEnumType = Array<{
  name: keyof ActivityTypes
  label: string
  icon: React.ReactNode
}>
