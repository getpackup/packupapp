import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { action, loader } from './resource.send-feedback'

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function buildRequest(method: string, body?: FormData) {
  return new Request('http://localhost:5173/resource/send-feedback', {
    method,
    body,
  })
}

const validRegisteredFields = {
  message: 'Great app!',
  emotion: '😍',
  category: 'Idea',
  isAnonymous: 'false',
  userDisplayName: 'Alex Hiker',
  userUsername: 'alex_hiker',
  userEmail: 'alex@example.com',
}

const validAnonFields = {
  message: 'Something is broken',
  emotion: '😭',
  category: 'Bug',
  isAnonymous: 'true',
}

describe('resource.send-feedback', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }))
    process.env.SLACK_FEEDBACK_WEBHOOK_URL = 'https://hooks.slack.com/test-webhook'
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
      const fd = buildFormData({ emotion: '😍', category: 'Idea', isAnonymous: 'false' })
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('returns 400 when emotion is missing', async () => {
      const fd = buildFormData({ message: 'Hello', category: 'Idea', isAnonymous: 'false' })
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('returns 400 when category is missing', async () => {
      const fd = buildFormData({ message: 'Hello', emotion: '😍', isAnonymous: 'false' })
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
      expect(url).toBe('https://hooks.slack.com/test-webhook')
      const body = JSON.parse(init.body)
      expect(body.blocks[0].text.text).toBe('New Feedback Submission')
      const bodyStr = JSON.stringify(body.blocks)
      expect(bodyStr).toContain('Alex Hiker')
      expect(bodyStr).toContain('alex_hiker')
      expect(bodyStr).toContain('alex@example.com')
      expect(bodyStr).toContain('😍')
      expect(bodyStr).toContain('Idea')
      expect(bodyStr).toContain('Great app!')
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
      const fd = buildFormData({ ...validRegisteredFields, url: 'https://app.getpackup.com/trips/123' })
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(JSON.stringify(body.blocks)).toContain('https://app.getpackup.com/trips/123')
    })

    it('omits Page field from Slack payload when url is not provided', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      const sectionFields = body.blocks[2].fields
      expect(sectionFields.every((f: { text: string }) => !f.text.includes('*Page*'))).toBe(true)
    })

    it('returns 500 when Slack webhook call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValue(new Error('Network error'))
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(500)
      consoleSpy.mockRestore()
    })

    it('returns 500 when Slack returns non-ok response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockResolvedValue(new Response(null, { status: 500 }))
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(500)
      consoleSpy.mockRestore()
    })
  })

  describe('loader', () => {
    it('returns 404', async () => {
      const response = (await loader()) as Response
      expect(response.status).toBe(404)
    })
  })
})
