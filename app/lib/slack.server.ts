import type { Firestore } from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'

import { getFirebaseAdmin } from '~/firebase/admin'

// --- Config ---

interface TeamNotificationsConfig {
  db?: Firestore
  onError?: (err: unknown) => void
}

let _config: TeamNotificationsConfig = {}

export function configureTeamNotifications(config: TeamNotificationsConfig): void {
  _config = config
}

// --- Types ---

export type NotifyTeamPayloads = {
  'feedback-submitted': {
    message: string
    emotion: string
    category: string
    isAnonymous: boolean
    anonymousEmail?: string
    displayName?: string
    username?: string
    userEmail?: string
    url?: string
  }
  'account-deleted': {
    displayName?: string
    username?: string
    email?: string
    reasons: string[]
    message?: string
  }
  'payment-completed': {
    amount: string
    currency: string
    customer: string
    sessionId: string
  }
  'user-signed-up': {
    displayName: string
    email: string
    isAnonymous: boolean
    username: string
  }
  'trip-created': {
    tripName: string
    ownerLabel: string
    dateRange: string
    location: string
  }
}

export type NotifyTeamEvent = keyof NotifyTeamPayloads

// --- Channel routing ---

const CHANNELS: Record<NotifyTeamEvent, string> = {
  'feedback-submitted': '#user-feedback',
  'account-deleted': '#user-feedback',
  'payment-completed': '#stripe',
  'user-signed-up': '#subscriptions',
  'trip-created': '#new-trip-notifications',
}

// --- Helpers ---

function escapeMrkdwn(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function esc(text: string | undefined | null, fallback = '—'): string {
  return text ? escapeMrkdwn(text.trim()) : fallback
}

// --- Block builders ---

function feedbackBlocks(p: NotifyTeamPayloads['feedback-submitted']): unknown[] {
  const identity = p.isAnonymous
    ? p.anonymousEmail
      ? `Anonymous User\nEmail: ${p.anonymousEmail}`
      : 'Anonymous User'
    : `${esc(p.displayName)} (@${esc(p.username)})\nEmail: ${esc(p.userEmail)}`

  return [
    { type: 'header', text: { type: 'plain_text', text: 'New Feedback Submission', emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Message*\n${escapeMrkdwn(p.message)}` } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Emotion*\n${esc(p.emotion)}` },
        { type: 'mrkdwn', text: `*Category*\n${esc(p.category)}` },
        { type: 'mrkdwn', text: `*From*\n${identity}` },
        ...(p.url ? [{ type: 'mrkdwn', text: `*Page*\n${escapeMrkdwn(p.url)}` }] : []),
      ],
    },
  ]
}

function accountDeletedBlocks(p: NotifyTeamPayloads['account-deleted']): unknown[] {
  if (!p.displayName && !p.email) {
    return buildAccountDeletedBlocksWithIdentity('Unknown user', p)
  }
  const name =
    p.displayName && p.username
      ? `${esc(p.displayName)} (@${esc(p.username)})`
      : esc(p.displayName ?? p.username, 'Unknown')
  const identity = p.email ? `${name}\nEmail: ${esc(p.email)}` : name
  return buildAccountDeletedBlocksWithIdentity(identity, p)
}

function buildAccountDeletedBlocksWithIdentity(
  identity: string,
  p: NotifyTeamPayloads['account-deleted']
): unknown[] {
  const reasons =
    p.reasons.length > 0 ? p.reasons.map((r) => `• ${r}`).join('\n') : '_None selected_'

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: ':warning: Account Deletion Request', emoji: true },
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*User*\n${identity}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Reasons*\n${reasons}` } },
    ...(p.message
      ? [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*Additional feedback*\n${escapeMrkdwn(p.message)}` },
          },
        ]
      : []),
  ]
}

function paymentCompletedBlocks(p: NotifyTeamPayloads['payment-completed']): unknown[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*One-time payment completed*\n• Amount: ${p.amount} ${p.currency}\n• Customer: ${esc(p.customer)}\n• Session: \`${p.sessionId}\``,
      },
    },
  ]
}

function userSignedUpBlocks(p: NotifyTeamPayloads['user-signed-up']): unknown[] {
  return [
    { type: 'header', text: { type: 'plain_text', text: 'New User Signup', emoji: true } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name*\n${esc(p.displayName)}` },
        { type: 'mrkdwn', text: `*Username*\n${esc(p.username)}` },
        { type: 'mrkdwn', text: `*Email*\n${p.isAnonymous ? 'Anonymous' : esc(p.email)}` },
      ],
    },
  ]
}

function tripCreatedBlocks(p: NotifyTeamPayloads['trip-created']): unknown[] {
  return [
    { type: 'header', text: { type: 'plain_text', text: 'New Trip Created', emoji: true } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Trip Name*\n${esc(p.tripName)}` },
        { type: 'mrkdwn', text: `*Trip Owner*\n${esc(p.ownerLabel)}` },
        { type: 'mrkdwn', text: `*Dates*\n${esc(p.dateRange)}` },
        { type: 'mrkdwn', text: `*Location*\n${esc(p.location)}` },
      ],
    },
  ]
}

const BLOCK_BUILDERS: { [E in NotifyTeamEvent]: (p: NotifyTeamPayloads[E]) => unknown[] } = {
  'feedback-submitted': feedbackBlocks,
  'account-deleted': accountDeletedBlocks,
  'payment-completed': paymentCompletedBlocks,
  'user-signed-up': userSignedUpBlocks,
  'trip-created': tripCreatedBlocks,
}

const FALLBACK_TEXT_BUILDERS: { [E in NotifyTeamEvent]: (p: NotifyTeamPayloads[E]) => string } = {
  'feedback-submitted': (p) => `${p.emotion} ${p.category} feedback`,
  'account-deleted': (p) =>
    `Account deletion request from ${p.displayName ?? p.email ?? 'Unknown user'}`,
  'payment-completed': (p) => `One-time payment completed: ${p.amount} ${p.currency}`,
  'user-signed-up': (p) =>
    p.isAnonymous
      ? 'New :packup: user signup (Anonymous)!'
      : `New :packup: user signup from ${p.displayName}!`,
  'trip-created': (p) => `New Trip Created: ${p.tripName} (${p.dateRange})`,
}

// --- HTTP call (internal) ---

async function postToSlack(channel: string, text: string, blocks: unknown[]): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) throw new Error('SLACK_BOT_TOKEN is not set')

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text, blocks }),
  })

  if (!response.ok) {
    throw new Error(`Slack API HTTP error: ${response.status}`)
  }

  const json = (await response.json()) as { ok: boolean; error?: string }
  if (!json.ok) {
    throw new Error(`Slack API error: ${json.error}`)
  }
}

// --- Audit log (internal) ---

async function writeFailureLog(
  event: NotifyTeamEvent,
  payload: NotifyTeamPayloads[NotifyTeamEvent],
  error: unknown
): Promise<void> {
  try {
    const db = _config.db ?? getFirestore(getFirebaseAdmin())
    await db.collection('teamNotificationFailures').add({
      event,
      payload,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date(),
    })
  } catch (dbErr) {
    console.error('Failed to write teamNotificationFailures:', dbErr)
  }
}

// --- Public API ---

export async function notifyTeam<E extends NotifyTeamEvent>(
  event: E,
  payload: NotifyTeamPayloads[E]
): Promise<void> {
  try {
    await postToSlack(
      CHANNELS[event],
      FALLBACK_TEXT_BUILDERS[event](payload),
      BLOCK_BUILDERS[event](payload)
    )
  } catch (err) {
    console.error(`notifyTeam failed for "${event}":`, err)
    _config.onError?.(err)
    await writeFailureLog(event, payload, err)
  }
}
