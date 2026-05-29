import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { action, loader } from './resource.delete-account'

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function buildRequest(method: string, body?: FormData) {
  return new Request('http://localhost:5173/resource/delete-account', {
    method,
    body,
  })
}

const validRegisteredFields = {
  userDisplayName: 'Alex Hiker',
  userUsername: 'alex_hiker',
  userEmail: 'alex@example.com',
}

describe('resource.delete-account', () => {
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

    it('returns 200 and posts to chat.postMessage for a valid request', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe('https://slack.com/api/chat.postMessage')
    })

    it('sends Authorization header with bot token', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const [, init] = mockFetch.mock.calls[0]
      expect(init.headers['Authorization']).toBe('Bearer xoxb-test-token')
    })

    it('posts to #user-feedback channel', async () => {
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      await action({ request, params: {}, context: {} } as any)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.channel).toBe('#user-feedback')
    })

    describe('buildSlackPayload – reasons list', () => {
      it('shows _None selected_ when no reasons are checked', async () => {
        const fd = buildFormData(validRegisteredFields)
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('_None selected_')
      })

      it('shows a single reason bullet when one reason is selected', async () => {
        const fd = buildFormData({ ...validRegisteredFields, 'privacy-concerns': 'true' })
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('Privacy concerns')
        expect(blocksStr).not.toContain('_None selected_')
      })

      it('shows multiple reason bullets when several reasons are selected', async () => {
        const fd = buildFormData({
          ...validRegisteredFields,
          'privacy-concerns': 'true',
          'not-useful': 'true',
          'other-reason': 'true',
        })
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('Privacy concerns')
        expect(blocksStr).toContain("Don't find the app useful anymore")
        expect(blocksStr).toContain('Other reason')
      })

      it('does not include unselected reasons', async () => {
        const fd = buildFormData({ ...validRegisteredFields, 'privacy-concerns': 'true' })
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).not.toContain('Found a better alternative')
      })
    })

    describe('buildSlackPayload – optional message field', () => {
      it('includes Additional feedback block when message is provided', async () => {
        const fd = buildFormData({ ...validRegisteredFields, message: 'Please delete my data.' })
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('Additional feedback')
        expect(blocksStr).toContain('Please delete my data.')
      })

      it('omits Additional feedback block when message is not provided', async () => {
        const fd = buildFormData(validRegisteredFields)
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).not.toContain('Additional feedback')
      })
    })

    describe('buildSlackPayload – identity text', () => {
      it('shows full name, username, and email for a registered user', async () => {
        const fd = buildFormData(validRegisteredFields)
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('Alex Hiker')
        expect(blocksStr).toContain('@alex_hiker')
        expect(blocksStr).toContain('alex@example.com')
      })

      it('shows Unknown user when no identity fields are provided', async () => {
        const fd = buildFormData({})
        const request = buildRequest('POST', fd)
        await action({ request, params: {}, context: {} } as any)
        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        const blocksStr = JSON.stringify(body.blocks)
        expect(blocksStr).toContain('Unknown user')
      })
    })

    it('returns 500 when Slack call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValue(new Error('Network error'))
      const fd = buildFormData(validRegisteredFields)
      const request = buildRequest('POST', fd)
      const response = (await action({ request, params: {}, context: {} } as any)) as Response
      expect(response.status).toBe(500)
      consoleSpy.mockRestore()
    })

    it('returns 500 when Slack returns ok: false', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ ok: false, error: 'channel_not_found' }), { status: 200 })
      )
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
