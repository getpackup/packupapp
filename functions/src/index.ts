import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import algoliasearch from 'algoliasearch'

import { renderSafetyItineraryHtml } from './render-email'
import { buildFirestoreDeps, processSafetyItineraries } from './safety-itinerary'
import type { SafetyItineraryEmailPayload } from '../../app/types/SafetyItinerary'
import type { User } from '../../app/types/User'
import { formattedDateRange } from '../../app/lib/date'
import { Trip } from '../../app/types/Trip'

// TODO: update to use new email from app/emails/ dir
import inviteToTripEmail from './invite-to-trip-email'

admin.initializeApp()

// ---------------------------------------------------------------------------
// Algolia
// ---------------------------------------------------------------------------
let _algoliaClient: ReturnType<typeof algoliasearch> | null = null

function getAlgoliaClient() {
  if (_algoliaClient) return _algoliaClient
  const appId = process.env.ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_API_KEY
  if (!appId || !apiKey) throw new Error('Algolia env vars not configured')
  _algoliaClient = algoliasearch(appId, apiKey)
  return _algoliaClient
}

function getUsersIndex() {
  return getAlgoliaClient().initIndex('Users')
}

// Stable reference to the admin stats document.
const adminStatsDoc = admin.firestore().collection('admin').doc('stats')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeSlackMrkdwn(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function postSlackIncomingWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

async function postToSlack(webhookUrl: string, text: string): Promise<void> {
  await postSlackIncomingWebhook(webhookUrl, { text })
}

function tripDateRangeLabel(trip: Trip): string {
  const startMs = trip.startDate?.toMillis?.()
  const endMs = trip.endDate?.toMillis?.()
  if (startMs === undefined || endMs === undefined) return '—'
  return formattedDateRange(startMs, endMs)
}

async function saveDocumentInAlgolia(snapshot: FirebaseFirestore.DocumentSnapshot): Promise<void> {
  if (snapshot.exists) {
    const record = snapshot.data()
    if (record) {
      record.objectID = snapshot.id
      await getUsersIndex().saveObject(record)
    }
  }
}

async function updateDocumentInAlgolia(change: {
  before: FirebaseFirestore.DocumentSnapshot
  after: FirebaseFirestore.DocumentSnapshot
}): Promise<void> {
  if (change.after.data()) {
    await saveDocumentInAlgolia(change.after)
  }
}

async function deleteDocumentFromAlgolia(
  snapshot: FirebaseFirestore.DocumentSnapshot
): Promise<void> {
  if (snapshot.exists) {
    await getUsersIndex().deleteObject(snapshot.id)
  }
}

// ---------------------------------------------------------------------------
// Packing list
// ---------------------------------------------------------------------------

export const addIdToPackingListItemOnCreate = onDocumentCreated(
  'trips/{tripId}/packing-list/{packingListId}',
  async (event) => {
    const { tripId, packingListId } = event.params
    const packingListItem = event.data?.data()

    await admin
      .firestore()
      .collection('trips')
      .doc(tripId)
      .collection('packing-list')
      .doc(packingListId)
      .update({ ...packingListItem, id: packingListId })
  }
)

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const newUserSignupPostToSlack = onDocumentCreated('users/{documentId}', async (event) => {
  const newUserData = event.data?.data()
  const isAnonymous = newUserData?.isAnonymous

  await postToSlack(
    process.env.SLACK_NEW_USER_NOTIFS_CHANNEL_WEBHOOK_URL!,
    `New :packup: user signup from ${isAnonymous ? 'Anonymous' : `${newUserData?.displayName} - ${newUserData?.email}`}!`
  )
})

export const updateAlgoliaOnUserCreate = onDocumentCreated('users/{documentId}', async (event) => {
  const snapshot = event.data
  if (!snapshot) return

  await saveDocumentInAlgolia(snapshot)

  // Increment the appropriate user counter based on whether the new user is anonymous.
  const userData = snapshot.data()
  const countField = userData?.isAnonymous ? 'anonymousUserCount' : 'registeredUserCount'
  await adminStatsDoc.set(
    { [countField]: admin.firestore.FieldValue.increment(1) },
    { merge: true }
  )
})

export const updateAlgoliaOnUserUpdate = onDocumentUpdated('users/{documentId}', async (event) => {
  if (!event.data) return

  await updateDocumentInAlgolia(event.data)

  // Detect an anonymous user converting to a registered account.
  // When this happens, move them from the anonymous bucket to the registered bucket.
  const before = event.data.before.data()
  const after = event.data.after.data()
  if (before?.isAnonymous === true && after?.isAnonymous === false) {
    await adminStatsDoc.set(
      {
        registeredUserCount: admin.firestore.FieldValue.increment(1),
        anonymousUserCount: admin.firestore.FieldValue.increment(-1),
      },
      { merge: true }
    )
  }
})

export const updateAgoliaOnUserDelete = onDocumentDeleted('users/{documentId}', async (event) => {
  if (event.data) await deleteDocumentFromAlgolia(event.data)
})

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export const newTripCreatedPostToSlack = onDocumentCreated('trips/{documentId}', async (event) => {
  const newTripData = event.data?.data() as Trip | undefined
  if (!newTripData) return

  const ownerUid = newTripData.owner
  let ownerLabel = ownerUid ?? '—'
  if (ownerUid) {
    const ownerSnap = await admin.firestore().collection('users').doc(ownerUid).get()
    const ownerUser = ownerSnap.data() as User | undefined
    const username = ownerUser?.username?.replace(/^@+/, '').trim()
    const displayName = ownerUser?.displayName?.trim()
    if (username) {
      ownerLabel = displayName ? `@${username} (${displayName})` : `@${username}`
    } else if (displayName) {
      ownerLabel = displayName
    }
  }

  const tripName = newTripData.name ?? '—'
  const dateRange = tripDateRangeLabel(newTripData)
  const location = newTripData.startingPoint?.trim() || '—'

  const fallbackText = `New Trip Created: ${tripName} (${dateRange})`

  await postSlackIncomingWebhook(process.env.SLACK_NEW_TRIP_NOTIFS_CHANNEL_WEBHOOK_URL!, {
    text: fallbackText,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'New Trip Created', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Trip Name*\n${escapeSlackMrkdwn(tripName)}` },
          { type: 'mrkdwn', text: `*Trip Owner*\n${escapeSlackMrkdwn(ownerLabel)}` },
          { type: 'mrkdwn', text: `*Dates*\n${escapeSlackMrkdwn(dateRange)}` },
          { type: 'mrkdwn', text: `*Location*\n${escapeSlackMrkdwn(location)}` },
        ],
      },
    ],
  })
})

// Increment tripCount each time a new trip is created.
export const incrementTripCount = onDocumentCreated('trips/{documentId}', async () => {
  await adminStatsDoc.set({ tripCount: admin.firestore.FieldValue.increment(1) }, { merge: true })
})

// ---------------------------------------------------------------------------
// Trip invitation email
// ---------------------------------------------------------------------------

export const sendInvitationToTripEmail = onRequest({ cors: true }, async (req, res) => {
  const { to, subject, username, tripId, isTestEnv, greetingName } = req.query

  if (
    typeof greetingName === 'string' &&
    typeof username === 'string' &&
    typeof tripId === 'string'
  ) {
    const sgMail = await import('@sendgrid/mail')
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')
    sgMail.default.setApiKey(apiKey)

    const generatedEmail = inviteToTripEmail({
      greetingName,
      username,
      isTestEnv: isTestEnv === 'true',
    })

    try {
      await sgMail.default.send({
        from: 'The Packup Team <hello@getpackup.com>',
        to: to as string,
        subject: subject as string,
        html: generatedEmail.htmlTemplate,
        text: generatedEmail.textOnlyTemplate,
      })
      res.send('Email sent successfully')
    } catch (error: any) {
      res.send(error.toString())
    }
  } else {
    res.status(400).send('Missing required query parameters')
  }
})

// ---------------------------------------------------------------------------
// Safety Itinerary
// Sent automatically at noon UTC the day before each trip's start date.
// ---------------------------------------------------------------------------

export const sendSafetyItineraries = onSchedule('every day 12:00', async () => {
  const db = admin.firestore()

  const sgMail = await import('@sendgrid/mail')
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')
  sgMail.default.setApiKey(apiKey)

  const sendEmail = async (payload: SafetyItineraryEmailPayload): Promise<void> => {
    const html = await renderSafetyItineraryHtml(payload)

    await sgMail.default.send({
      to: payload.to,
      from: 'Packup <noreply@getpackup.com>',
      subject: `Safety Itinerary: ${payload.tripName}`,
      html,
    })
  }

  const deps = buildFirestoreDeps(db, sendEmail)
  const count = await processSafetyItineraries(deps)
  console.log(`Safety Itinerary: sent ${count} emails`)
})

// ---------------------------------------------------------------------------
// Admin stats — one-time backfill
//
// Run this once after deploying to seed admin/stats with accurate counts
// derived from the current state of the database. Safe to run multiple times
// (idempotent: uses set(), not increment()). Delete this function and redeploy
// once you have confirmed the values in Firestore look correct.
// ---------------------------------------------------------------------------

export const initializeAdminStats = onRequest(async (req, res) => {
  const [tripsSnapshot, usersSnapshot] = await Promise.all([
    admin.firestore().collection('trips').get(),
    admin.firestore().collection('users').get(),
  ])

  const tripCount = tripsSnapshot.size
  let registeredUserCount = 0
  let anonymousUserCount = 0

  usersSnapshot.forEach((doc) => {
    const user = doc.data()
    if (user.isAnonymous) {
      anonymousUserCount++
    } else {
      registeredUserCount++
    }
  })

  // Hard set (not increment) so this is safe to run multiple times.
  await adminStatsDoc.set({ tripCount, registeredUserCount, anonymousUserCount })

  res.status(200).json({ tripCount, registeredUserCount, anonymousUserCount })
})

// ---------------------------------------------------------------------------
// Admin stats — public read endpoint
//
// Returns the current counts from admin/stats as JSON. Intentionally public
// since the data is non-sensitive aggregate counts suitable for a marketing
// page or admin dashboard.
// ---------------------------------------------------------------------------

export const getAdminStats = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    res.status(403).send('Forbidden')
    return
  }

  const doc = await adminStatsDoc.get()
  if (!doc.exists) {
    res.status(404).json({ error: 'Admin stats not found. Run initializeAdminStats first.' })
    return
  }

  res.status(200).json(doc.data())
})

// ---------------------------------------------------------------------------
// User info lookup
// ---------------------------------------------------------------------------

export const getPublicUserInfo = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'PUT' || req.method === 'POST') {
    res.status(403).send('Forbidden!')
    return
  }

  const queriedUser = await admin
    .firestore()
    .collection('users')
    .where('username', '==', req.query.username)
    .limit(1)
    .get()

  if (queriedUser.empty) {
    res.status(404).send('User not found')
    return
  }

  const userArray: Partial<User>[] = []
  queriedUser.forEach((doc) => {
    const user = doc.data() as User
    userArray.push({
      displayName: user.displayName,
      photoURL: user.photoURL || '',
      username: user.username,
      lastUpdated: user.lastUpdated,
    })
  })

  res.status(200).send(userArray[0])
})
