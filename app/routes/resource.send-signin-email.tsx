import { render, toPlainText } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { MagicLinkSigninEmail } from 'react-email/emails/magic-link-signin'
import { type ActionFunction } from 'react-router'

import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendSigninEmailBody {
  email: string
}

// Simple device detection from user-agent string
function detectDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown'

  const ua = userAgent.toLowerCase()

  // Detect mobile devices
  if (/mobile|android|iphone|ipad|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/iphone|ipad|ipod/i.test(ua)) return '📱 iOS Device'
    if (/android/i.test(ua)) return '📱 Android Device'
    if (/windows phone/i.test(ua)) return '📱 Windows Phone'
    return '📱 Unknown Mobile Device'
  }

  // Detect operating systems
  if (/windows nt/i.test(ua)) return '💻 Windows'
  if (/macintosh|mac os x/i.test(ua)) return '💻 macOS'
  if (/linux/i.test(ua)) return '💻 Linux'
  if (/unix/i.test(ua)) return '💻 Unix'

  // Detect browsers for desktop
  if (/edg/i.test(ua)) return 'Edge'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/msie|trident/i.test(ua)) return 'Internet Explorer'

  return 'Unknown'
}

// Extract IP address from request headers
function extractIPAddress(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return 'Unknown'
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

    // The credential is base64 encoded, so we need to decode it first
    const base64Credential = process.env.VITE_FIREBASE_ADMIN_CREDENTIAL!
    const decodedCredential = Buffer.from(base64Credential, 'base64').toString('utf-8')
    const credential = JSON.parse(decodedCredential)

    // Check if Firebase app is already initialized
    const apps = getApps()
    const app = apps.length > 0 ? apps[0] : initializeApp({ credential: cert(credential) })

    const auth = getAuth(app)

    const actionCodeSettings = {
      url: `${request.headers.get('origin')}/signin`,
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

    // Extract security information
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const device = detectDevice(userAgent)
    const ipAddress = extractIPAddress(request)
    const utcTime = new Date().toISOString()

    const html = await render(
      <MagicLinkSigninEmail
        signinUrl={signinUrl}
        ipAddress={ipAddress}
        device={device}
        timestamp={utcTime}
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
