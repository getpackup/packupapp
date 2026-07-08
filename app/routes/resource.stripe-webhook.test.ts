import { describe, expect, it, vi, beforeEach } from 'vitest'

const { mockUpdate, mockDoc, mockConstructEvent, mockCustomersRetrieve, mockNotifyTeam } = vi.hoisted(() => {
  const mockUpdate = vi.fn()
  return {
    mockUpdate,
    mockDoc: vi.fn(() => ({ update: mockUpdate })),
    mockConstructEvent: vi.fn(),
    mockCustomersRetrieve: vi.fn(),
    mockNotifyTeam: vi.fn(),
  }
})

vi.mock('stripe', () => ({
  default: function MockStripe() {
    return {
      webhooks: { constructEvent: mockConstructEvent },
      customers: { retrieve: mockCustomersRetrieve },
    }
  },
}))

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => ['existing-app']),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({ doc: mockDoc })),
  })),
}))

vi.mock('~/lib/slack.server', () => ({ notifyTeam: mockNotifyTeam }))

import { action, loader } from './resource.stripe-webhook'

function buildRequest(body = '{}') {
  return new Request('http://localhost:5173/resource/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-sig' },
    body,
  })
}

function makeCheckoutSessionEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: { mode: 'subscription', client_reference_id: 'user-uid-123', ...overrides },
    },
  }
}

function makeSubscriptionEvent({
  type,
  status,
  customerId = 'cus_test',
  currentPeriodEnd = 9999999999,
  cancelAtPeriodEnd = false,
}: {
  type: string
  status: string
  customerId?: string
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
}) {
  return {
    type,
    data: {
      object: {
        status,
        customer: customerId,
        cancel_at_period_end: cancelAtPeriodEnd,
        items: { data: [{ current_period_end: currentPeriodEnd }] },
      },
    },
  }
}

describe('resource.stripe-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    mockCustomersRetrieve.mockResolvedValue({ metadata: { uid: 'user-uid-from-meta' } })
    mockNotifyTeam.mockResolvedValue(undefined)
  })

  describe('action', () => {
    it('returns 405 for non-POST', async () => {
      const req = new Request('http://localhost:5173/resource/stripe-webhook', { method: 'GET' })
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(405)
    })

    it('returns 500 when Stripe env vars missing', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const req = buildRequest()
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(500)
    })

    it('returns 400 when stripe-signature header missing', async () => {
      const req = new Request('http://localhost:5173/resource/stripe-webhook', {
        method: 'POST',
        body: '{}',
      })
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(400)
    })

    it('returns 400 when signature verification fails', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Bad signature')
      })
      const req = buildRequest()
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(400)
    })

    describe('checkout.session.completed (subscription mode)', () => {
      it('writes plan: pro to the correct user document', async () => {
        mockConstructEvent.mockReturnValue(makeCheckoutSessionEvent())
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockDoc).toHaveBeenCalledWith('user-uid-123')
        expect(mockUpdate).toHaveBeenCalledWith({ plan: 'pro' })
      })

      it('skips Firestore write and returns 200 when client_reference_id missing', async () => {
        mockConstructEvent.mockReturnValue(
          makeCheckoutSessionEvent({ client_reference_id: null })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).not.toHaveBeenCalled()
      })

      it('does not write plan for payment mode sessions', async () => {
        mockConstructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: {
              mode: 'payment',
              client_reference_id: 'user-uid-123',
              amount_total: 1000,
              currency: 'usd',
              customer_email: 'user@example.com',
              customer: 'cus_test',
              id: 'cs_test',
            },
          },
        })
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('customer.subscription.deleted', () => {
      it('writes plan: free to the correct user document', async () => {
        mockConstructEvent.mockReturnValue(makeSubscriptionEvent({ type: 'customer.subscription.deleted', status: 'canceled' }))
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockCustomersRetrieve).toHaveBeenCalledWith('cus_test')
        expect(mockDoc).toHaveBeenCalledWith('user-uid-from-meta')
        expect(mockUpdate).toHaveBeenCalledWith({ plan: 'free' })
      })

      it('skips Firestore write and returns 200 when uid not in customer metadata', async () => {
        mockCustomersRetrieve.mockResolvedValue({ metadata: {} })
        mockConstructEvent.mockReturnValue(makeSubscriptionEvent({ type: 'customer.subscription.deleted', status: 'canceled' }))
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('customer.subscription.created', () => {
      it('writes plan: pro and period fields when status is active', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.created',
            status: 'active',
            currentPeriodEnd: 9999999999,
            cancelAtPeriodEnd: false,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockDoc).toHaveBeenCalledWith('user-uid-from-meta')
        expect(mockUpdate).toHaveBeenCalledWith({
          plan: 'pro',
          subscriptionCurrentPeriodEnd: 9999999999,
          subscriptionCancelAtPeriodEnd: false,
        })
      })

      it('writes only period fields when status is trialing (no plan change)', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.created',
            status: 'trialing',
            currentPeriodEnd: 9999999999,
            cancelAtPeriodEnd: true,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).toHaveBeenCalledWith({
          subscriptionCurrentPeriodEnd: 9999999999,
          subscriptionCancelAtPeriodEnd: true,
        })
      })

      it('skips Firestore write and returns 200 when uid not in customer metadata', async () => {
        mockCustomersRetrieve.mockResolvedValue({ metadata: {} })
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({ type: 'customer.subscription.created', status: 'active' })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('customer.subscription.updated', () => {
      it('writes plan: pro and period fields when status is active', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.updated',
            status: 'active',
            currentPeriodEnd: 9999999999,
            cancelAtPeriodEnd: false,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockDoc).toHaveBeenCalledWith('user-uid-from-meta')
        expect(mockUpdate).toHaveBeenCalledWith({
          plan: 'pro',
          subscriptionCurrentPeriodEnd: 9999999999,
          subscriptionCancelAtPeriodEnd: false,
        })
      })

      it('writes plan: free and period fields when status is canceled', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.updated',
            status: 'canceled',
            currentPeriodEnd: 1234567890,
            cancelAtPeriodEnd: true,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).toHaveBeenCalledWith({
          plan: 'free',
          subscriptionCurrentPeriodEnd: 1234567890,
          subscriptionCancelAtPeriodEnd: true,
        })
      })

      it('writes plan: free and period fields when status is unpaid', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.updated',
            status: 'unpaid',
            currentPeriodEnd: 1234567890,
            cancelAtPeriodEnd: false,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).toHaveBeenCalledWith({
          plan: 'free',
          subscriptionCurrentPeriodEnd: 1234567890,
          subscriptionCancelAtPeriodEnd: false,
        })
      })

      it('writes only period fields for other statuses (e.g. trialing)', async () => {
        mockConstructEvent.mockReturnValue(
          makeSubscriptionEvent({
            type: 'customer.subscription.updated',
            status: 'trialing',
            currentPeriodEnd: 9999999999,
            cancelAtPeriodEnd: false,
          })
        )
        const req = buildRequest()
        const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
        expect(res.status).toBe(200)
        expect(mockUpdate).toHaveBeenCalledWith({
          subscriptionCurrentPeriodEnd: 9999999999,
          subscriptionCancelAtPeriodEnd: false,
        })
      })
    })

    it('returns 200 for unhandled event types', async () => {
      mockConstructEvent.mockReturnValue({ type: 'some.unknown.event', data: { object: {} } })
      const req = buildRequest()
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(200)
    })
  })

  describe('loader', () => {
    it('returns 404', async () => {
      const res = (await loader()) as Response
      expect(res.status).toBe(404)
    })
  })
})
