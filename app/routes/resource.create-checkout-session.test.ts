import { describe, expect, it, vi, beforeEach } from 'vitest'

const { mockPricesList, mockSessionsCreate } = vi.hoisted(() => {
  const mockPricesList = vi.fn()
  const mockSessionsCreate = vi.fn()
  return { mockPricesList, mockSessionsCreate }
})

vi.mock('stripe', () => ({
  default: function MockStripe() {
    return {
      prices: { list: mockPricesList },
      checkout: { sessions: { create: mockSessionsCreate } },
    }
  },
}))

vi.mock('~/lib/getObjectFromFormData', () => ({
  default: (fd: FormData) => Object.fromEntries(fd.entries()),
}))

import { action, loader } from './resource.create-checkout-session'

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function buildRequest(body?: FormData) {
  return new Request('http://localhost:5173/resource/create-checkout-session', {
    method: 'POST',
    body,
  })
}

describe('resource.create-checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    mockPricesList.mockResolvedValue({ data: [{ id: 'price_123' }] })
    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' })
  })

  describe('action', () => {
    it('returns 405 for non-POST', async () => {
      const req = new Request('http://localhost:5173/resource/create-checkout-session', { method: 'GET' })
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(405)
    })

    it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly', uid: 'user-123' }))
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(500)
    })

    it('returns 400 when lookup_key is missing', async () => {
      const req = buildRequest(buildFormData({ uid: 'user-123' }))
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('lookup_key')
    })

    it('returns 400 when uid is missing', async () => {
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly' }))
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('uid')
    })

    it('creates session with client_reference_id set to uid', async () => {
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly', uid: 'user-abc' }))
      await action({ request: req, params: {}, context: {} } as any)
      expect(mockSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ client_reference_id: 'user-abc' })
      )
    })

    it('creates session with correct success_url', async () => {
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly', uid: 'user-abc' }))
      await action({ request: req, params: {}, context: {} } as any)
      expect(mockSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ success_url: 'http://localhost:5173/settings?checkout=success' })
      )
    })

    it('creates session with correct cancel_url', async () => {
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly', uid: 'user-abc' }))
      await action({ request: req, params: {}, context: {} } as any)
      expect(mockSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ cancel_url: 'https://getpackup.com/pricing' })
      )
    })

    it('redirects to session url on success', async () => {
      const req = buildRequest(buildFormData({ lookup_key: 'pro_monthly', uid: 'user-abc' }))
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(303)
      expect(res.headers.get('location')).toBe('https://checkout.stripe.com/pay/cs_test')
    })

    it('returns 404 when price not found', async () => {
      mockPricesList.mockResolvedValue({ data: [] })
      const req = buildRequest(buildFormData({ lookup_key: 'nonexistent', uid: 'user-abc' }))
      const res = (await action({ request: req, params: {}, context: {} } as any)) as Response
      expect(res.status).toBe(404)
    })
  })

  describe('loader', () => {
    it('returns 404', async () => {
      const res = (await loader()) as Response
      expect(res.status).toBe(404)
    })
  })
})
