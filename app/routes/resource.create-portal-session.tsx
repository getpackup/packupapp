import { type ActionFunction, redirect } from 'react-router'
import Stripe from 'stripe'

import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface CreatePortalSessionBody {
  session_id: string
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const formData = await request.formData()
  const { session_id } = getObjectFromFormData<CreatePortalSessionBody>(formData)

  if (!session_id) {
    return new Response(JSON.stringify({ error: 'Missing session_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(secretKey)
  const url = new URL(request.url)
  const returnUrl = url.origin

  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

  const customerId =
    typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : checkoutSession.customer?.id

  if (!customerId) {
    return new Response(JSON.stringify({ error: 'Checkout session has no customer' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return redirect(portalSession.url, { status: 303 })
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
