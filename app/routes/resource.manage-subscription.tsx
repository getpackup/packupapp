import { getFirestore } from 'firebase-admin/firestore'
import { type ActionFunction, redirect } from 'react-router'
import Stripe from 'stripe'

import { getFirebaseAdmin } from '~/firebase/admin'
import getObjectFromFormData from '~/lib/getObjectFromFormData'
import type { User } from '~/types/User'

interface ManageSubscriptionBody {
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
    return redirect('/settings?subscription_error=not_configured')
  }

  const formData = await request.formData()
  const { uid } = getObjectFromFormData<ManageSubscriptionBody>(formData)

  if (!uid) {
    return redirect('/settings?subscription_error=missing_uid')
  }

  const adminApp = getFirebaseAdmin()
  const db = getFirestore(adminApp)
  const userSnap = await db.collection('users').doc(uid).get()

  if (!userSnap.exists) {
    return redirect('/settings?subscription_error=user_not_found')
  }

  const userData = userSnap.data() as Partial<User>
  const customerId = userData?.stripeCustomerId

  if (!customerId) {
    return redirect('/settings?subscription_error=no_customer')
  }

  const stripe = new Stripe(secretKey)
  const url = new URL(request.url)

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${url.origin}/settings`,
  })

  return redirect(portalSession.url, { status: 303 })
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
