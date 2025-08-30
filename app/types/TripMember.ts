import { Timestamp } from 'firebase/firestore'

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
}

export type TripMember = {
  invitedAt: Timestamp
  declinedAt?: Timestamp
  acceptedAt?: Timestamp
  removedAt?: Timestamp
  status: TripMemberStatus
  uid: string
  invitedBy?: string
}
