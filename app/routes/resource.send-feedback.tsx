import { type ActionFunction } from 'react-router'

import { AnalyticsEvent, trackNodeEvent } from '~/lib/analytics'
import getObjectFromFormData from '~/lib/getObjectFromFormData'
import { notifyTeam } from '~/lib/slack.server'

interface SendFeedbackBody {
  message: string
  emotion: string
  category: string
  isAnonymous: string
  userId?: string
  email?: string
  userDisplayName?: string
  userUsername?: string
  userEmail?: string
  url?: string
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const formData = await request.formData()
  const fields = getObjectFromFormData<SendFeedbackBody>(formData)
  const { message, emotion, category, userId } = fields

  if (!message || !emotion || !category) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (userId) {
    trackNodeEvent(AnalyticsEvent.FeedbackSubmitted, userId, {
      source: 'server',
      feedback_type: category,
    })
  }

  await notifyTeam('feedback-submitted', {
    message,
    emotion,
    category,
    isAnonymous: fields.isAnonymous === 'true',
    anonymousEmail: fields.email,
    displayName: fields.userDisplayName,
    username: fields.userUsername,
    userEmail: fields.userEmail,
    url: fields.url,
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
