import type { Timestamp } from 'firebase/firestore'

export enum TripMemberStatus {
  /** User is the one who created the trip */
  Owner = 'Owner',
  /** User has been invited, but not yet accepted */
  Pending = 'Pending',
  /** User has accepted  */
  Accepted = 'Accepted',
  /** User declined the invitation */
  Declined = 'Declined',
  /** Removed by trip owner */
  Removed = 'Removed',
  /** Member voluntarily left the trip */
  Left = 'Left',
}

export type TripMember = {
  invitedAt: Timestamp
  declinedAt?: Timestamp
  acceptedAt?: Timestamp
  removedAt?: Timestamp
  personalTags?: string[]
  safetyItineraryOptedOut?: boolean
  status: TripMemberStatus
  uid: string
  invitedBy?: string
}
