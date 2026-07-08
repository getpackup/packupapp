import { getFirestore } from 'firebase-admin/firestore'
import { type ActionFunction } from 'react-router'
import Stripe from 'stripe'

import { getFirebaseAdmin } from '~/firebase/admin'
import { notifyTeam } from '~/lib/slack.server'
import type { Plan } from '~/types/User'

async function writeUserPlan(uid: string, plan: Plan) {
  const app = getFirebaseAdmin()
  const db = getFirestore(app)
  await db.collection('users').doc(uid).update({ plan })
}

async function writeUserSubscriptionState(
  uid: string,
  updates: Record<string, unknown>
) {
  const app = getFirebaseAdmin()
  const db = getFirestore(app)
  await db.collection('users').doc(uid).update(updates)
}

async function getUidFromCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if ('deleted' in customer && customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.uid ?? null
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
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
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'payment') {
        const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '—'
        const currency = (session.currency ?? '').toUpperCase()
        await notifyTeam('payment-completed', {
          amount,
          currency,
          customer: session.customer_email ?? String(session.customer ?? '—'),
          sessionId: session.id,
        })
      } else if (session.mode === 'subscription') {
        const uid = session.client_reference_id
        if (!uid) {
          console.warn('checkout.session.completed: missing client_reference_id, skipping plan write')
          break
        }
        await writeUserPlan(uid, 'pro')
      }
      break
    }
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription trial_will_end:', subscription.status)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const uid = await getUidFromCustomer(stripe, subscription.customer as string)
      if (!uid) {
        console.warn('customer.subscription.deleted: no uid in customer metadata, skipping plan write')
        break
      }
      await writeUserPlan(uid, 'free')
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const uid = await getUidFromCustomer(stripe, subscription.customer as string)
      if (!uid) {
        console.warn(`${event.type}: no uid in customer metadata, skipping`)
        break
      }
      const updates: Record<string, unknown> = {
        subscriptionCurrentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
      if (subscription.status === 'active') {
        updates.plan = 'pro'
      } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        updates.plan = 'free'
      }
      await writeUserSubscriptionState(uid, updates)
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
