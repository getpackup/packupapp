import type { Firestore } from 'firebase-admin/firestore'
import type { Messaging } from 'firebase-admin/messaging'

import type { Trip } from '../../app/types/Trip'
import type { User } from '../../app/types/User'
import { TripMemberStatus } from '../../app/types/TripMember'

export interface ChatNotificationDeps {
  getTrip: () => Promise<Pick<Trip, 'name' | 'tripMembers'> | null>
  getUsersByUids: (uids: string[]) => Promise<Map<string, User>>
  sendNotifications: (
    tokens: string[],
    payload: { notification: { title: string }; data: Record<string, string> }
  ) => Promise<{ success: boolean; error?: { code: string } }[]>
  removeTokens: (uid: string, tokens: string[]) => Promise<void>
}

const ELIGIBLE_STATUSES = new Set<TripMemberStatus>([
  TripMemberStatus.Owner,
  TripMemberStatus.Accepted,
  TripMemberStatus.Pending,
])

interface TokenOwner {
  token: string
  userId: string
}

export async function processChatNotification(
  message: { userId: string; userName: string; type: string },
  tripId: string,
  deps: ChatNotificationDeps
): Promise<number> {
  if (message.type === 'system') return 0

  const trip = await deps.getTrip()
  if (!trip) return 0

  const eligibleMembers = Object.values(trip.tripMembers)
    .filter((m) => ELIGIBLE_STATUSES.has(m.status))
    .filter((m) => m.uid !== message.userId)

  if (eligibleMembers.length === 0) return 0

  const uids = eligibleMembers.map((m) => m.uid)
  const usersMap = await deps.getUsersByUids(uids)

  const tokenOwners: TokenOwner[] = []
  for (const member of eligibleMembers) {
    const user = usersMap.get(member.uid)
    if (!user) continue
    if (user.preferences?.chatNotificationsEnabled === false) continue
    for (const token of user.fcmTokens ?? []) {
      tokenOwners.push({ token, userId: user.uid })
    }
  }

  if (tokenOwners.length === 0) return 0

  const tokens = tokenOwners.map((t) => t.token)
  const results = await deps.sendNotifications(tokens, {
    notification: { title: `${message.userName} sent a message in ${trip.name}` },
    data: { tripId, url: `/trips/${tripId}?chat=open` },
  })

  const staleByUser = new Map<string, string[]>()
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (
      !result.success &&
      result.error?.code === 'messaging/registration-token-not-registered'
    ) {
      const owner = tokenOwners[i]
      const stale = staleByUser.get(owner.userId) ?? []
      stale.push(owner.token)
      staleByUser.set(owner.userId, stale)
    }
  }

  for (const [uid, staleTokens] of staleByUser) {
    await deps.removeTokens(uid, staleTokens)
  }

  return tokenOwners.length
}

export function buildChatNotificationDeps(
  db: Firestore,
  messaging: Messaging,
  tripId: string
): ChatNotificationDeps {
  return {
    getTrip: async () => {
      const snap = await db.collection('trips').doc(tripId).get()
      return snap.exists ? (snap.data() as Trip) : null
    },

    getUsersByUids: async (uids) => {
      const map = new Map<string, User>()
      if (uids.length === 0) return map

      const batches: string[][] = []
      for (let i = 0; i < uids.length; i += 30) {
        batches.push(uids.slice(i, i + 30))
      }

      for (const batch of batches) {
        const snapshot = await db.collection('users').where('uid', 'in', batch).get()
        for (const doc of snapshot.docs) {
          const data = doc.data() as User
          map.set(data.uid, data)
        }
      }

      return map
    },

    sendNotifications: async (tokens, payload) => {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data,
      })
      return response.responses.map((r) => ({
        success: r.success,
        error: r.error ? { code: r.error.code } : undefined,
      }))
    },

    removeTokens: async (uid, tokens) => {
      const { FieldValue } = await import('firebase-admin/firestore')
      await db
        .collection('users')
        .doc(uid)
        .update({ fcmTokens: FieldValue.arrayRemove(...tokens) })
    },
  }
}
