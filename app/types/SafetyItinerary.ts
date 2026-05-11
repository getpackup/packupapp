import type { EmergencyContact } from './EmergencyContact'
import type { TripMemberStatus } from './TripMember'

export type SafetyItineraryMember = {
  displayName: string
  status: TripMemberStatus
}

export type SafetyItineraryEmailProps = {
  tripName: string
  startingPoint: string
  dateRange: string
  description: string
  members: SafetyItineraryMember[]
  emergencyContacts: EmergencyContact[]
  url: string
}

export type SafetyItineraryEmailPayload = {
  to: string
  tripName: string
  startingPoint: string
  dateRange: string
  description: string
  members: SafetyItineraryMember[]
  emergencyContacts: EmergencyContact[]
  recipientUid: string
}
