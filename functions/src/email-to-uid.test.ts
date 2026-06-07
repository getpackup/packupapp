import { describe, expect, it } from 'vitest'

import type { EmailToUidDeps } from './email-to-uid'
import { createInMemoryRateLimitStore, processEmailToUidRequest } from './email-to-uid'

function makeDeps(uid: string | null = 'uid-123'): EmailToUidDeps {
  return {
    lookupUserByEmail: async () => uid,
    rateLimitStore: createInMemoryRateLimitStore(5, 60_000),
  }
}

describe('processEmailToUidRequest', () => {
  it('returns 200 with uid when email matches a user', async () => {
    const deps = makeDeps('uid-abc')

    const result = await processEmailToUidRequest('user@example.com', '1.2.3.4', deps)

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ uid: 'uid-abc' })
  })

  it('returns 404 with generic message when email does not match any user', async () => {
    const deps = makeDeps(null)

    const result = await processEmailToUidRequest('notfound@example.com', '1.2.3.4', deps)

    expect(result.status).toBe(404)
    expect(result.body).toHaveProperty('message')
  })

  it('does not reveal whether email exists in the 404 response', async () => {
    const deps = makeDeps(null)

    const result = await processEmailToUidRequest('notfound@example.com', '1.2.3.4', deps)

    const body = result.body as { message: string }
    expect(body.message).not.toMatch(/not found/i)
    expect(body.message).not.toMatch(/no account/i)
    expect(body.message).not.toMatch(/does not exist/i)
  })

  it('returns 429 when IP exceeds the rate limit', async () => {
    const store = createInMemoryRateLimitStore(3, 60_000)
    const deps: EmailToUidDeps = {
      lookupUserByEmail: async () => 'uid-123',
      rateLimitStore: store,
    }

    await processEmailToUidRequest('a@example.com', '5.5.5.5', deps)
    await processEmailToUidRequest('b@example.com', '5.5.5.5', deps)
    await processEmailToUidRequest('c@example.com', '5.5.5.5', deps)
    const result = await processEmailToUidRequest('d@example.com', '5.5.5.5', deps)

    expect(result.status).toBe(429)
  })

  it('allows different IPs to each make requests up to the limit', async () => {
    const store = createInMemoryRateLimitStore(2, 60_000)
    const deps: EmailToUidDeps = {
      lookupUserByEmail: async () => 'uid-123',
      rateLimitStore: store,
    }

    await processEmailToUidRequest('a@example.com', '10.0.0.1', deps)
    await processEmailToUidRequest('b@example.com', '10.0.0.1', deps)

    const resultIp2 = await processEmailToUidRequest('c@example.com', '10.0.0.2', deps)
    expect(resultIp2.status).toBe(200)

    const resultIp1 = await processEmailToUidRequest('d@example.com', '10.0.0.1', deps)
    expect(resultIp1.status).toBe(429)
  })

  it('rate limit window resets after the window expires', async () => {
    const store = createInMemoryRateLimitStore(1, 0)
    const deps: EmailToUidDeps = {
      lookupUserByEmail: async () => 'uid-123',
      rateLimitStore: store,
    }

    await processEmailToUidRequest('a@example.com', '9.9.9.9', deps)
    // Window of 0ms means any subsequent call is in a new window.
    const result = await processEmailToUidRequest('b@example.com', '9.9.9.9', deps)

    expect(result.status).toBe(200)
  })
})

describe('createInMemoryRateLimitStore', () => {
  it('is not rate limited on first request', () => {
    const store = createInMemoryRateLimitStore(3, 60_000)
    expect(store.isRateLimited('ip')).toBe(false)
  })

  it('is rate limited after exceeding maxRequests', () => {
    const store = createInMemoryRateLimitStore(2, 60_000)
    store.recordRequest('ip')
    store.recordRequest('ip')
    expect(store.isRateLimited('ip')).toBe(true)
  })

  it('is not rate limited before reaching maxRequests', () => {
    const store = createInMemoryRateLimitStore(3, 60_000)
    store.recordRequest('ip')
    store.recordRequest('ip')
    expect(store.isRateLimited('ip')).toBe(false)
  })
})
