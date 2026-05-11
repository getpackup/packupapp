import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import type { EmailPayload } from './safety-itinerary'
import { buildFirestoreDeps, processSafetyItineraries } from './safety-itinerary'

admin.initializeApp()

export const sendSafetyItineraries = onSchedule('every day 12:00', async () => {
  const db = admin.firestore()

  const sendEmail = async (payload: EmailPayload): Promise<void> => {
    const sgMail = await import('@sendgrid/mail')
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')
    sgMail.default.setApiKey(apiKey)

    await sgMail.default.send({
      to: payload.to,
      from: 'Packup <noreply@getpackup.com>',
      subject: `Safety Itinerary: ${payload.tripName}`,
      text: [
        `Safety Itinerary for ${payload.tripName}`,
        `Location: ${payload.startingPoint}`,
        `Dates: ${payload.dateRange}`,
        payload.description ? `Description: ${payload.description}` : '',
        '',
        'Trip Members:',
        ...payload.members.map((m) => `  ${m.displayName} (${m.status})`),
        '',
        'Emergency Contacts:',
        ...(payload.emergencyContacts.length > 0
          ? payload.emergencyContacts.map(
              (c) => `  ${c.name} — ${c.phoneNumber}${c.email ? ` — ${c.email}` : ''}`
            )
          : ['  No emergency contacts on file.']),
        '',
        'Local SAR: ___________',
        'Area Emergency Number: ___________',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  const deps = buildFirestoreDeps(db, sendEmail)
  const count = await processSafetyItineraries(deps)
  console.log(`Safety Itinerary: sent ${count} emails`)
})
