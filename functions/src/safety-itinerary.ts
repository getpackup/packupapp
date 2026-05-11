import type { Firestore, Timestamp } from 'firebase-admin/firestore'

export interface TripMember {
  uid: string
  status: 'Owner' | 'Accepted' | 'Pending' | 'Declined' | 'Removed' | 'Left'
  safetyItineraryOptedOut?: boolean
}

export interface EmergencyContact {
  name: string
  phoneNumber: string
  email: string
}

export interface UserDoc {
  uid: string
  email: string
  displayName: string
  emergencyContacts?: EmergencyContact[]
  preferences?: {
    safetyItineraryEnabled?: boolean
  }
}

export interface TripDoc {
  tripId: string
  name: string
  startingPoint: string
  startDate: Timestamp
  endDate: Timestamp
  description: string
  archived?: boolean
  tripMembers: { [uid: string]: TripMember }
}

export interface EmailPayload {
  to: string
  tripName: string
  startingPoint: string
  dateRange: string
  description: string
  members: Array<{ displayName: string; status: string }>
  emergencyContacts: EmergencyContact[]
  recipientUid: string
}

export interface Dependencies {
  getTripsStartingTomorrow: () => Promise<TripDoc[]>
  getUsersByUids: (uids: string[]) => Promise<Map<string, UserDoc>>
  sendEmail: (payload: EmailPayload) => Promise<void>
}

const ELIGIBLE_STATUSES = new Set(['Owner', 'Accepted', 'Pending'])

function formatDateRange(startDate: Timestamp, endDate: Timestamp): string {
  const start = startDate.toDate()
  const end = endDate.toDate()
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export async function processSafetyItineraries(deps: Dependencies): Promise<number> {
  const trips = await deps.getTripsStartingTomorrow()
  let emailsSent = 0

  for (const trip of trips) {
    if (trip.archived) continue

    const members = Object.values(trip.tripMembers)
    const eligibleMembers = members.filter((m) => ELIGIBLE_STATUSES.has(m.status))

    if (eligibleMembers.length === 0) continue

    const uids = eligibleMembers.map((m) => m.uid)
    const usersMap = await deps.getUsersByUids(uids)

    const allMembers = members
      .filter((m) => m.status !== 'Removed')
      .map((m) => {
        const user = usersMap.get(m.uid)
        return { displayName: user?.displayName ?? 'Unknown', status: m.status }
      })

    for (const member of eligibleMembers) {
      if (member.safetyItineraryOptedOut) continue

      const user = usersMap.get(member.uid)
      if (!user) continue

      if (user.preferences?.safetyItineraryEnabled === false) continue

      await deps.sendEmail({
        to: user.email,
        tripName: trip.name,
        startingPoint: trip.startingPoint,
        dateRange: formatDateRange(trip.startDate, trip.endDate),
        description: trip.description,
        members: allMembers,
        emergencyContacts: user.emergencyContacts ?? [],
        recipientUid: user.uid,
      })
      emailsSent++
    }
  }

  return emailsSent
}

export function buildFirestoreDeps(db: Firestore, sendGridSend: (payload: EmailPayload) => Promise<void>): Dependencies {
  return {
    getTripsStartingTomorrow: async () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(0, 0, 0, 0)
      const dayAfter = new Date(tomorrow)
      dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

      const { Timestamp: AdminTimestamp } = await import('firebase-admin/firestore')
      const startOfDay = AdminTimestamp.fromDate(tomorrow)
      const endOfDay = AdminTimestamp.fromDate(dayAfter)

      const snapshot = await db
        .collection('trips')
        .where('startDate', '>=', startOfDay)
        .where('startDate', '<', endOfDay)
        .get()

      return snapshot.docs.map((doc) => doc.data() as TripDoc)
    },

    getUsersByUids: async (uids: string[]) => {
      const map = new Map<string, UserDoc>()
      if (uids.length === 0) return map

      const batches: string[][] = []
      for (let i = 0; i < uids.length; i += 30) {
        batches.push(uids.slice(i, i + 30))
      }

      for (const batch of batches) {
        const snapshot = await db
          .collection('users')
          .where('uid', 'in', batch)
          .get()
        for (const doc of snapshot.docs) {
          const data = doc.data() as UserDoc
          map.set(data.uid, data)
        }
      }

      return map
    },

    sendEmail: sendGridSend,
  }
}
