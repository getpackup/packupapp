import { type ActionFunction } from 'react-router'

import { AnalyticsEvent, trackNodeEvent } from '~/lib/analytics'
import getObjectFromFormData from '~/lib/getObjectFromFormData'
import { notifyTeam } from '~/lib/slack.server'

interface DeleteAccountBody {
  message?: string
  userId?: string
  'privacy-concerns'?: string
  'not-useful'?: string
  'better-alternative'?: string
  'other-reason'?: string
  userDisplayName?: string
  userUsername?: string
  userEmail?: string
}

const REASON_LABELS: Record<string, string> = {
  'privacy-concerns': 'Privacy concerns',
  'not-useful': "Don't find the app useful anymore",
  'better-alternative': 'Found a better alternative',
  'other-reason': 'Other reason',
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const formData = await request.formData()
  const fields = getObjectFromFormData<DeleteAccountBody>(formData)

  const reasons = Object.keys(REASON_LABELS)
    .filter((key) => fields[key as keyof DeleteAccountBody] === 'true')
    .map((k) => REASON_LABELS[k])

  if (fields.userId) {
    trackNodeEvent(AnalyticsEvent.AccountDeleted, fields.userId, {
      source: 'server',
    })
  }

  await notifyTeam('account-deleted', {
    displayName: fields.userDisplayName,
    username: fields.userUsername,
    email: fields.userEmail,
    reasons,
    message: fields.message,
  })

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
