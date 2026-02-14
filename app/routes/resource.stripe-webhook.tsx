import { type ActionFunction } from 'react-router'
import Stripe from 'stripe'

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const endpointSecret = 'whsec_25bf26c92627cb95210a6ee1cafd1b34a3e93b014a2242785cea0bdda698e70d' // process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !endpointSecret) {
    return new Response(JSON.stringify({ error: 'Stripe webhook not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rawBody = await request.text()
  const stripe = new Stripe(secretKey)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  switch (event.type) {
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription trial_will_end:', subscription.status)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription deleted:', subscription.status)
      break
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription created:', subscription.status)
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', subscription.status)
      break
    }
    case 'entitlements.active_entitlement_summary.updated': {
      const summary = event.data.object
      console.log('Active entitlement summary updated:', summary)
      break
    }
    default:
      console.log('Unhandled event type:', (event as Stripe.Event).type)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
