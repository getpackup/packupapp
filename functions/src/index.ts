import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import type { EmailPayload } from './safety-itinerary'
import { buildFirestoreDeps, processSafetyItineraries } from './safety-itinerary'
import { renderSafetyItineraryHtml } from './render-email'

admin.initializeApp()

export const sendSafetyItineraries = onSchedule('every day 12:00', async () => {
  const db = admin.firestore()

  const sgMail = await import('@sendgrid/mail')
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')
  sgMail.default.setApiKey(apiKey)

  const sendEmail = async (payload: EmailPayload): Promise<void> => {
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
