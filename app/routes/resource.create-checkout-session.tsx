import { type ActionFunction, redirect } from 'react-router'
import Stripe from 'stripe'

import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface CreateCheckoutSessionBody {
  lookup_key: string
  uid: string
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
  const { lookup_key, uid } = getObjectFromFormData<CreateCheckoutSessionBody>(formData)

  if (!lookup_key) {
    return new Response(JSON.stringify({ error: 'Missing lookup_key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!uid) {
    return new Response(JSON.stringify({ error: 'Missing uid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(secretKey)
  const url = new URL(request.url)
  const origin = url.origin

  const prices = await stripe.prices.list({
    lookup_keys: [lookup_key],
    expand: ['data.product'],
  })

  if (!prices.data[0]) {
    return new Response(JSON.stringify({ error: 'Price not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: prices.data[0].id,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    client_reference_id: uid,
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: 'https://getpackup.com/pricing',
  })

  if (!session.url) {
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return redirect(session.url, { status: 303 })
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
