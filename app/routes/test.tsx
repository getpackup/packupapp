import { useEffect, useState } from 'react'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Test | Packup' }]
}

const ProductDisplay = () => (
  <section>
    <div className="product">
      <div className="description">
        <h3>packup pro</h3>
        <h5>CA$3.00 / month</h5>
      </div>
    </div>
    <form action="/resource/create-checkout-session" method="POST">
      {/* Add a hidden field with the lookup_key of your Price */}
      <input type="hidden" name="lookup_key" value="packup_pro_monthly" />
      <button id="checkout-and-portal-button" type="submit">
        Checkout
      </button>
    </form>
  </section>
)

const SuccessDisplay = ({ sessionId }: { sessionId: string }) => {
  return (
    <section>
      <div className="product Box-root">
        <div className="description Box-root">
          <h3>Subscription to packup pro successful!</h3>
        </div>
      </div>
      <form action="/resource/create-portal-session" method="POST">
        <input type="hidden" id="session-id" name="session_id" value={sessionId} />
        <button id="checkout-and-portal-button" type="submit">
          Manage your billing information
        </button>
      </form>
    </section>
  )
}

const Message = ({ message }: { message: string }) => (
  <section>
    <p>{message}</p>
  </section>
)

export default function Test() {
  let [message, setMessage] = useState('')
  let [success, setSuccess] = useState(false)
  let [sessionId, setSessionId] = useState('')

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search)

    if (query.get('success')) {
      setSuccess(true)
      setSessionId(query.get('session_id') ?? '')
    }

    if (query.get('canceled')) {
      setSuccess(false)
      setMessage("Order canceled -- continue to shop around and checkout when you're ready.")
    }
  }, [sessionId])
  return (
    <>
      <PageHeader crumbs={[{ label: 'Test', href: '/test' }]} />
      <PageContent>
        {!success && message === '' && <ProductDisplay />}
        {success && sessionId !== '' && <SuccessDisplay sessionId={sessionId} />}
        {message !== '' && <Message message={message} />}
      </PageContent>
    </>
  )
}
