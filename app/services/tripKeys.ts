import type { QueryConstraint } from 'firebase/firestore'

const tripRootKey = ['trips'] as const

export const tripKeys = {
  root: tripRootKey,
  all: (constraints: QueryConstraint[]) => [...tripRootKey, ...constraints] as const,
  byId: (tripId: string) => [...tripRootKey, tripId] as const,
  packingListRoot: (tripId: string) => [...tripRootKey, tripId, 'packing-list'] as const,
  packingList: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'packing-list', ...constraints] as const,
  membersRoot: (tripId: string) => [...tripRootKey, tripId, 'trip-members'] as const,
  members: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'trip-members', ...constraints] as const,
  messagesRoot: (tripId: string) => [...tripRootKey, tripId, 'messages'] as const,
  messages: (tripId: string, constraints: QueryConstraint[]) =>
    [...tripRootKey, tripId, 'messages', ...constraints] as const,
  chatReadStatus: (tripId: string) => [...tripRootKey, tripId, 'chatReadStatus'] as const,
}
