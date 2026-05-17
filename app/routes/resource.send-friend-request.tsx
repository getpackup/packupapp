import { render, toPlainText } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { type ActionFunction } from 'react-router'

import FriendRequestEmail from '~/emails/friend-request'
import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendFriendRequestBody {
  recipientEmail: string
  recipientUid: string
  requesterDisplayName: string
  requesterUsername: string
}

function getFirebaseAdmin() {
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  }

  if (process.env.VITE_FIREBASE_ADMIN_CREDENTIAL) {
    const decodedCredential = Buffer.from(
      process.env.VITE_FIREBASE_ADMIN_CREDENTIAL,
      'base64'
    ).toString('utf-8')
    return initializeApp({ credential: cert(JSON.parse(decodedCredential)) })
  }

  throw new Error(
    'Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or VITE_FIREBASE_ADMIN_CREDENTIAL.'
  )
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
    const { recipientEmail, recipientUid, requesterDisplayName, requesterUsername } =
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
