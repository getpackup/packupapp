import { type ActionFunction } from 'react-router'

import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendFeedbackBody {
  message: string
  emotion: string
  category: string
  isAnonymous: string
  email?: string
  userDisplayName?: string
  userUsername?: string
  userEmail?: string
}

function buildSlackText(fields: SendFeedbackBody): string {
  const { message, emotion, category, isAnonymous, email, userDisplayName, userUsername, userEmail } = fields
  const isAnon = isAnonymous === 'true'

  let identity: string
  if (isAnon) {
    identity = email ? `*Anonymous User*\nEmail: ${email}` : `*Anonymous User*`
  } else {
    identity = `*${userDisplayName}* (@${userUsername})\nEmail: ${userEmail}`
  }

  return `${emotion} *${category}* feedback\n\n${message}\n\n---\n${identity}`
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const fields = getObjectFromFormData<SendFeedbackBody>(formData)
    const { message, emotion, category } = fields

    if (!message || !emotion || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL
    const slackResponse = await fetch(webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: buildSlackText(fields) }),
    })

    if (!slackResponse.ok) {
      throw new Error(`Slack webhook responded with ${slackResponse.status}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending feedback to Slack:', error)
    return new Response(JSON.stringify({ error: 'Failed to send feedback' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
