import { render, toPlainText } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { getFirestore } from 'firebase-admin/firestore'
import { type ActionFunction } from 'react-router'

import FriendRequestEmail from '~/emails/friend-request'
import { getFirebaseAdmin } from '~/firebase/admin'
import { AnalyticsEvent, trackNodeEvent } from '~/lib/analytics'
import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendFriendRequestBody {
  recipientEmail: string
  recipientUid: string
  requesterUid: string
  requesterDisplayName: string
  requesterUsername: string
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
    const { recipientEmail, recipientUid, requesterUid, requesterDisplayName, requesterUsername } =
      getObjectFromFormData<SendFriendRequestBody>(formData)

    if (!recipientEmail || !requesterUsername) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (recipientUid) {
      const app = getFirebaseAdmin()
      const db = getFirestore(app)
      const userDoc = await db.collection('users').doc(recipientUid).get()
      const userData = userDoc.data()
      if (userData?.preferences?.friendRequestEmailEnabled === false) {
        return new Response(
          JSON.stringify({ success: true, message: 'Recipient has opted out of friend request emails' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

    const url = new URL(request.url)
    const baseUrl = url.origin

    const html = await render(
      <FriendRequestEmail
        requesterDisplayName={requesterDisplayName}
        requesterUsername={requesterUsername}
        url={baseUrl}
      />
    )
    const text = toPlainText(html)

    const msg = {
      to: recipientEmail,
      from: 'Packup <noreply@getpackup.com>',
      subject: `@${requesterUsername} sent you a friend request on Packup`,
      html,
      text,
    }

    await sgMail.send(msg)

    if (requesterUid && recipientUid) {
      trackNodeEvent(AnalyticsEvent.FriendRequestSent, requesterUid, {
        source: 'server',
        recipient_user_id: recipientUid,
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Friend request email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending friend request email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send friend request email' }), {
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
