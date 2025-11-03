import { render, toPlainText } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { type ActionFunction } from 'react-router'

import { MagicLinkSigninEmail } from '~/emails/magic-link-signin'
import extractFromRequest from '~/lib/extractFromRequest'
import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendSigninEmailBody {
  email: string
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
    const { email } = getObjectFromFormData<SendSigninEmailBody>(formData)

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Firebase Admin
    // Try individual env vars first (recommended for Netlify), fallback to base64 credential
    const apps = getApps()
    let app
    if (apps.length > 0) {
      app = apps[0]
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    } else if (process.env.VITE_FIREBASE_ADMIN_CREDENTIAL) {
      // Fallback to base64-encoded credential for backwards compatibility
      const base64Credential = process.env.VITE_FIREBASE_ADMIN_CREDENTIAL
      const decodedCredential = Buffer.from(base64Credential, 'base64').toString('utf-8')
      const credential = JSON.parse(decodedCredential)
      app = initializeApp({ credential: cert(credential) })
    } else {
      throw new Error(
        'Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or VITE_FIREBASE_ADMIN_CREDENTIAL.'
      )
    }

    const auth = getAuth(app)

    const actionCodeSettings = {
      url:
        process.env.NODE_ENV === 'production'
          ? 'https://new.packupapp.com/signin'
          : 'http://localhost:5173/signin',
      handleCodeInApp: true,
    }

    const signinUrl = await auth
      .generateSignInWithEmailLink(email, actionCodeSettings)
      .then((link: string) => {
        return link
      })
      .catch((error) => {
        console.error(error)
      })

    if (!signinUrl) {
      return new Response(JSON.stringify({ error: 'Failed to generate signin link' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

    const utcTime = new Date().toISOString()
    const { device, ipAddress } = extractFromRequest(request)

    const html = await render(
      <MagicLinkSigninEmail
        signinUrl={signinUrl}
        ipAddress={ipAddress}
        device={device}
        timestamp={utcTime}
        url={
          process.env.NODE_ENV === 'production'
            ? 'https://new.packupapp.com'
            : 'http://localhost:5173'
        }
      />
    )
    const text = toPlainText(html)

    const msg = {
      to: email,
      from: 'The Packup Team <noreply@getpackup.com>',
      subject: `🪄 Your requested Packup sign in link`,
      html: html,
      text: text,
    }

    await sgMail.send(msg)

    return new Response(JSON.stringify({ success: true, message: 'Signin email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending signin email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send signin email' }), {
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
