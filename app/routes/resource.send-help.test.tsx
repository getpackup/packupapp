import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('firebase-admin/firestore', () => ({ getFirestore: vi.fn(() => ({})) }))
vi.mock('~/firebase/admin', () => ({ getFirebaseAdmin: vi.fn(() => ({})) }))

import { action, loader } from './resource.send-help'

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function buildRequest(method: string, body?: FormData) {
  return new Request('http://localhost:5173/resource/send-help', {
    method,
    body,
  })
}

const validRegisteredFields = {
  message: 'How do I add a trip member?',
  isAnonymous: 'false',
  userDisplayName: 'Alex Hiker',
  userUsername: 'alex_hiker',
  userEmail: 'alex@example.com',
}

const validAnonFields = {
  message: 'I cannot manage my subscription',
  isAnonymous: 'true',
}

describe('resource.send-help', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
  })

  describe('action', () => {
    it('returns 405 for non-POST requests', async () => {
      const request = buildRequest('GET')
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(405)
      const json = await response.json()
      expect(json.error).toBe('Method not allowed')
    })

    it('returns 400 when message is missing', async () => {
      const fd = buildFormData({ isAnonymous: 'false' })
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('returns 200 and posts to Slack for registered user', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe('https://slack.com/api/chat.postMessage')
      const body = JSON.parse(init.body)
      expect(body.channel).toBe('#user-feedback')
      expect(body.blocks[0].text.text).toBe('New Help Request')
      const bodyStr = JSON.stringify(body.blocks)
      expect(bodyStr).toContain('Alex Hiker')
      expect(bodyStr).toContain('alex_hiker')
      expect(bodyStr).toContain('alex@example.com')
      expect(bodyStr).toContain('How do I add a trip member?')
    })

    it('labels sender as Anonymous User when isAnonymous is true', async () => {
      const fd = buildFormData(validAnonFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(200)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(JSON.stringify(body.blocks)).toContain('Anonymous User')
    })

    it('includes optional email for Anonymous User when provided', async () => {
      const fd = buildFormData({ ...validAnonFields, email: 'anon@example.com' })
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      const bodyStr = JSON.stringify(body.blocks)
      expect(bodyStr).toContain('Anonymous User')
      expect(bodyStr).toContain('anon@example.com')
    })

    it('includes url in Slack payload when provided', async () => {
      const fd = buildFormData({ ...validRegisteredFields, url: 'https://app.getpackup.com/settings' })
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(JSON.stringify(body.blocks)).toContain('https://app.getpackup.com/settings')
    })

    it('omits Page field from Slack payload when url is not provided', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      const sectionFields = body.blocks[2].fields
      expect(sectionFields.every((f: { text: string }) => !f.text.includes('*Page*'))).toBe(true)
    })
  })

  describe('loader', () => {
    it('returns 404', async () => {
      const response = (await loader()) as Response
      expect(response.status).toBe(404)
    })
  })
})
