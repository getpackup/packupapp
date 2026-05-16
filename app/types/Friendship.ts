import type { Timestamp } from 'firebase/firestore'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export type Friendship = {
  id: string
  uids: [string, string]
  requesterUid: string
  status: FriendshipStatus
  requestedAt: Timestamp
  respondedAt?: Timestamp
  declinedAt?: Timestamp
}

export function buildFriendshipId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_')
}
