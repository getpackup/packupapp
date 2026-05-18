import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: (...args: unknown[]) => mockSend(...args),
  },
}))

vi.mock('@react-email/render', () => ({
  render: vi.fn(() => Promise.resolve('<html>email</html>')),
  toPlainText: vi.fn(() => 'plain text email'),
}))

const mockGet = vi.fn()
vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => ['existing-app']),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: () => ({
      doc: () => ({
        get: () => mockGet(),
      }),
    }),
  })),
}))

import { action, loader } from './resource.send-friend-request'

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function buildRequest(method: string, body?: FormData) {
  return new Request('http://localhost:5173/resource/send-friend-request', {
    method,
    body,
  })
}

describe('resource.send-friend-request', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue([{ statusCode: 202 }])
    mockGet.mockReset()
    mockGet.mockResolvedValue({ data: () => ({}) })
  })

  describe('action', () => {
    it('returns 405 for non-POST requests', async () => {
      const request = buildRequest('GET')
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
      expect(response.status).toBe(405)
      const json = await response.json()
      expect(json.error).toBe('Method not allowed')
    })

    it('returns 400 when required fields are missing', async () => {
      const fd = buildFormData({ requesterUsername: 'alex' })
      const request = buildRequest('POST', fd)
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('sends email via SendGrid when all fields provided', async () => {
      const fd = buildFormData({
        recipientEmail: 'friend@example.com',
        recipientUid: 'uid-recipient',
        requesterDisplayName: 'Alex Hiker',
        requesterUsername: 'alex_hiker',
      })
      const request = buildRequest('POST', fd)
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
      expect(response.status).toBe(200)
      expect(mockSend).toHaveBeenCalledTimes(1)
      const msg = mockSend.mock.calls[0][0]
      expect(msg.to).toBe('friend@example.com')
      expect(msg.subject).toContain('alex_hiker')
    })

    it('does not send email when recipient has opted out', async () => {
      mockGet.mockResolvedValue({
        data: () => ({ preferences: { friendRequestEmailEnabled: false } }),
      })
      const fd = buildFormData({
        recipientEmail: 'friend@example.com',
        recipientUid: 'uid-opted-out',
        requesterDisplayName: 'Alex Hiker',
        requesterUsername: 'alex_hiker',
      })
      const request = buildRequest('POST', fd)
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.message).toContain('opted out')
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('sends email when recipient has no preference set (default enabled)', async () => {
      mockGet.mockResolvedValue({ data: () => ({ preferences: {} }) })
      const fd = buildFormData({
        recipientEmail: 'friend@example.com',
        recipientUid: 'uid-default',
        requesterDisplayName: 'Alex Hiker',
        requesterUsername: 'alex_hiker',
      })
      const request = buildRequest('POST', fd)
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
      expect(response.status).toBe(200)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('returns 500 when SendGrid fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSend.mockRejectedValue(new Error('SendGrid error'))
      const fd = buildFormData({
        recipientEmail: 'friend@example.com',
        recipientUid: 'uid-recipient',
        requesterDisplayName: 'Alex Hiker',
        requesterUsername: 'alex_hiker',
      })
      const request = buildRequest('POST', fd)
      const response = (await action({
        request,
        params: {},
        context: {},
      } as any)) as Response
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
