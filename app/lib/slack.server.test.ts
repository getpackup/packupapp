import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Firestore } from 'firebase-admin/firestore'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('firebase-admin/firestore', () => ({ getFirestore: vi.fn() }))
vi.mock('~/firebase/admin', () => ({ getFirebaseAdmin: vi.fn() }))

import { configureTeamNotifications, notifyTeam } from './slack.server'

const okResponse = () =>
  new Response(JSON.stringify({ ok: true }), { status: 200 })

const mockAdd = vi.fn().mockResolvedValue(undefined)
const mockDb = { collection: vi.fn().mockReturnValue({ add: mockAdd }) } as unknown as Firestore

describe('notifyTeam', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
    mockFetch.mockResolvedValue(okResponse())
    configureTeamNotifications({ db: mockDb })
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('channel routing', () => {
    it('routes feedback-submitted to #user-feedback', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Great app',
        emotion: '😀',
        category: 'General',
        isAnonymous: false,
        displayName: 'Alice',
        username: 'alice',
        userEmail: 'alice@test.com',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).channel).toBe('#user-feedback')
    })

    it('routes account-deleted to #user-feedback', async () => {
      await notifyTeam('account-deleted', {
        displayName: 'Bob',
        email: 'bob@test.com',
        reasons: [],
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).channel).toBe('#user-feedback')
    })

    it('routes payment-completed to #stripe', async () => {
      await notifyTeam('payment-completed', {
        amount: '9.99',
        currency: 'USD',
        customer: 'cus_123',
        sessionId: 'cs_123',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).channel).toBe('#stripe')
    })

    it('routes user-signed-up to #subscriptions', async () => {
      await notifyTeam('user-signed-up', {
        displayName: 'Carol',
        email: 'carol@test.com',
        isAnonymous: false,
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).channel).toBe('#subscriptions')
    })

    it('routes trip-created to #new-trip-notifications', async () => {
      await notifyTeam('trip-created', {
        tripName: 'Weekend Hike',
        ownerLabel: '@alice',
        dateRange: 'Jun 1–2',
        location: 'Yosemite',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).channel).toBe('#new-trip-notifications')
    })
  })

  describe('fallback text', () => {
    it('builds correct text for feedback-submitted', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Nice',
        emotion: '😀',
        category: 'Bug',
        isAnonymous: false,
        displayName: 'Alice',
        username: 'alice',
        userEmail: 'alice@test.com',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe('😀 Bug feedback')
    })

    it('builds correct text for account-deleted', async () => {
      await notifyTeam('account-deleted', {
        displayName: 'Bob',
        email: 'bob@test.com',
        reasons: [],
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe(
        'Account deletion request from Bob'
      )
    })

    it('builds correct text for payment-completed', async () => {
      await notifyTeam('payment-completed', {
        amount: '9.99',
        currency: 'USD',
        customer: 'cus_123',
        sessionId: 'cs_123',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe(
        'One-time payment completed: 9.99 USD'
      )
    })

    it('builds anonymous signup text', async () => {
      await notifyTeam('user-signed-up', {
        displayName: '—',
        email: '—',
        isAnonymous: true,
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe(
        'New :packup: user signup (Anonymous)!'
      )
    })

    it('builds registered signup text', async () => {
      await notifyTeam('user-signed-up', {
        displayName: 'Carol',
        email: 'carol@test.com',
        isAnonymous: false,
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe(
        'New :packup: user signup from Carol!'
      )
    })

    it('builds correct text for trip-created', async () => {
      await notifyTeam('trip-created', {
        tripName: 'Weekend Hike',
        ownerLabel: '@alice',
        dateRange: 'Jun 1–2',
        location: 'Yosemite',
      })
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe(
        'New Trip Created: Weekend Hike (Jun 1–2)'
      )
    })
  })

  describe('block structure', () => {
    it('feedback-submitted: header + message section + fields section', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Looks good',
        emotion: '😀',
        category: 'General',
        isAnonymous: false,
        displayName: 'Alice',
        username: 'alice',
        userEmail: 'alice@test.com',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[0].type).toBe('header')
      expect(blocks[1].text.text).toContain('Looks good')
      expect(blocks[2].fields).toHaveLength(3)
    })

    it('feedback-submitted: includes url field when provided', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Crash on this page',
        emotion: '😞',
        category: 'Bug',
        isAnonymous: false,
        displayName: 'Alice',
        username: 'alice',
        userEmail: 'alice@test.com',
        url: '/trips/123',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[2].fields).toHaveLength(4)
      expect(blocks[2].fields[3].text).toContain('/trips/123')
    })

    it('feedback-submitted: anonymous identity without email', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Hi',
        emotion: '😐',
        category: 'Other',
        isAnonymous: true,
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[2].fields[2].text).toContain('Anonymous User')
    })

    it('feedback-submitted: anonymous identity with email', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Hi',
        emotion: '😐',
        category: 'Other',
        isAnonymous: true,
        anonymousEmail: 'anon@test.com',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[2].fields[2].text).toContain('anon@test.com')
    })

    it('account-deleted: shows reasons list', async () => {
      await notifyTeam('account-deleted', {
        displayName: 'Bob',
        username: 'bob',
        email: 'bob@test.com',
        reasons: ['Privacy concerns', 'Found a better alternative'],
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[2].text.text).toContain('• Privacy concerns')
      expect(blocks[2].text.text).toContain('• Found a better alternative')
    })

    it('account-deleted: shows _None selected_ when no reasons', async () => {
      await notifyTeam('account-deleted', {
        displayName: 'Bob',
        email: 'bob@test.com',
        reasons: [],
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[2].text.text).toContain('_None selected_')
    })

    it('account-deleted: includes additional feedback block when message present', async () => {
      await notifyTeam('account-deleted', {
        displayName: 'Bob',
        email: 'bob@test.com',
        reasons: [],
        message: 'Just too expensive',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks).toHaveLength(4)
      expect(blocks[3].text.text).toContain('Just too expensive')
    })

    it('account-deleted: falls back to Unknown user when no identity data', async () => {
      await notifyTeam('account-deleted', { reasons: [] })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[1].text.text).toContain('Unknown user')
    })

    it('trip-created: four fields with trip details', async () => {
      await notifyTeam('trip-created', {
        tripName: 'Weekend Hike',
        ownerLabel: '@alice',
        dateRange: 'Jun 1–2',
        location: 'Yosemite',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[1].fields).toHaveLength(4)
      expect(blocks[1].fields[0].text).toContain('Weekend Hike')
    })
  })

  describe('mrkdwn escaping', () => {
    it('escapes &, <, > in trip name', async () => {
      await notifyTeam('trip-created', {
        tripName: 'A & B <Trip>',
        ownerLabel: '@alice',
        dateRange: 'Jun 1–2',
        location: 'Somewhere',
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[1].fields[0].text).toContain('A &amp; B &lt;Trip&gt;')
    })

    it('escapes & in feedback message', async () => {
      await notifyTeam('feedback-submitted', {
        message: 'Cats & Dogs',
        emotion: '😀',
        category: 'General',
        isAnonymous: true,
      })
      const { blocks } = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(blocks[1].text.text).toContain('Cats &amp; Dogs')
    })
  })

  describe('on Slack failure', () => {
    it('does not throw', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(
        notifyTeam('user-signed-up', {
          displayName: 'Alice',
          email: 'alice@test.com',
          isAnonymous: false,
        })
      ).resolves.toBeUndefined()
    })

    it('logs the error with event name', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-signed-up'),
        expect.any(Error)
      )
    })

    it('calls onError callback if configured', async () => {
      const onError = vi.fn()
      configureTeamNotifications({ db: mockDb, onError })
      mockFetch.mockRejectedValue(new Error('Network error'))
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('writes to teamNotificationFailures with event, payload, and error', async () => {
      mockFetch.mockRejectedValue(new Error('Slack down'))
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockDb.collection).toHaveBeenCalledWith('teamNotificationFailures')
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'user-signed-up',
          error: 'Slack down',
          payload: expect.objectContaining({ displayName: 'Alice' }),
          failedAt: expect.any(Date),
        })
      )
    })

    it('does not throw if Firestore write also fails', async () => {
      mockAdd.mockRejectedValue(new Error('Firestore error'))
      mockFetch.mockRejectedValue(new Error('Slack down'))
      await expect(
        notifyTeam('user-signed-up', {
          displayName: 'Alice',
          email: 'alice@test.com',
          isAnonymous: false,
        })
      ).resolves.toBeUndefined()
    })

    it('still calls onError even if Firestore write fails', async () => {
      const onError = vi.fn()
      configureTeamNotifications({ db: mockDb, onError })
      mockAdd.mockRejectedValue(new Error('Firestore error'))
      mockFetch.mockRejectedValue(new Error('Slack down'))
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('always writes to Firestore on failure, using injected db if configured', async () => {
      mockFetch.mockRejectedValue(new Error('Slack down'))
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockAdd).toHaveBeenCalled()
    })
  })

  describe('HTTP mechanics', () => {
    it('calls chat.postMessage with the correct URL', async () => {
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockFetch.mock.calls[0][0]).toBe('https://slack.com/api/chat.postMessage')
    })

    it('sends Authorization header with bot token', async () => {
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer xoxb-test-token')
    })

    it('treats Slack ok:false as a failure and writes to audit log', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ ok: false, error: 'channel_not_found' }), { status: 200 })
      )
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Slack API error: channel_not_found' })
      )
    })

    it('does not call Slack when SLACK_BOT_TOKEN is missing', async () => {
      delete process.env.SLACK_BOT_TOKEN
      await notifyTeam('user-signed-up', {
        displayName: 'Alice',
        email: 'alice@test.com',
        isAnonymous: false,
      })
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'SLACK_BOT_TOKEN is not set' })
      )
    })
  })
})
