import sgMail from '@sendgrid/mail'
import { type ActionFunction } from 'react-router'

import inviteToTripEmail from '~/email-templates/inviteToTripEmail'
import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface SendTripInvitationBody {
  invitedBy: string
  email: string
  greetingName: string
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
    const { invitedBy, email, greetingName } =
      getObjectFromFormData<SendTripInvitationBody>(formData)

    if (!greetingName || !invitedBy || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

    const { htmlTemplate, textOnlyTemplate } = inviteToTripEmail({
      greetingName,
      username: invitedBy,
    })

    const msg = {
      to: email,
      from: 'The Packup Team <hello@getpackup.com>',
      subject: `${invitedBy} has invited you on a trip 🏕️`,
      html: htmlTemplate,
      text: textOnlyTemplate,
    }

    await sgMail.send(msg)

    return new Response(JSON.stringify({ success: true, message: 'Invitation email sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending trip invitation email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
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
