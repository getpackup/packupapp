import { type ActionFunction } from 'react-router'

import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface DeleteAccountBody {
  message?: string
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

function buildReasonsText(fields: DeleteAccountBody): string {
  const selected = Object.keys(REASON_LABELS).filter((key) => fields[key as keyof DeleteAccountBody] === 'true')
  return selected.length > 0 ? selected.map((k) => `• ${REASON_LABELS[k]}`).join('\n') : '_None selected_'
}

function buildIdentityText(fields: DeleteAccountBody): string {
  const { userDisplayName, userUsername, userEmail } = fields
  if (!userDisplayName && !userEmail) return 'Unknown user'
  const name = userDisplayName && userUsername ? `${userDisplayName} (@${userUsername})` : userDisplayName ?? userUsername ?? 'Unknown'
  return userEmail ? `${name}\nEmail: ${userEmail}` : name
}

function buildSlackPayload(fields: DeleteAccountBody): Record<string, unknown> {
  const identity = buildIdentityText(fields)
  const reasons = buildReasonsText(fields)

  return {
    text: `Account deletion request from ${identity}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: ':warning: Account Deletion Request', emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*User*\n${identity}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Reasons*\n${reasons}` },
      },
      ...(fields.message
        ? [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Additional feedback*\n${fields.message}` },
            },
          ]
        : []),
    ],
  }
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
    const fields = getObjectFromFormData<DeleteAccountBody>(formData)

    const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL
    const slackResponse = await fetch(webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSlackPayload(fields)),
    })

    if (!slackResponse.ok) {
      throw new Error(`Slack webhook responded with ${slackResponse.status}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending account deletion to Slack:', error)
    return new Response(JSON.stringify({ error: 'Failed to send request' }), {
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
