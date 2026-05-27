import { render, toPlainText } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { getAuth } from 'firebase-admin/auth'
import { type ActionFunction } from 'react-router'

import { MagicLinkSigninEmail } from '~/emails/magic-link-signin'
import { getFirebaseAdmin } from '~/firebase/admin'
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

    const auth = getAuth(getFirebaseAdmin())

    const url = new URL(request.url)
    const baseUrl = url.origin

    const actionCodeSettings = {
      url: `${baseUrl}/signin`,
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
        url={baseUrl}
      />
    )
    const text = toPlainText(html)

    const msg = {
      to: email,
      from: 'Packup <noreply@getpackup.com>',
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
