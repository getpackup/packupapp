import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { postSlackMessage } from './slack'

describe('postSlackMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
  })

  it('calls chat.postMessage with the bot token in Authorization header', async () => {
    await postSlackMessage('#new-users', { text: 'Hello' })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://slack.com/api/chat.postMessage')
    expect(init.headers['Authorization']).toBe('Bearer xoxb-test-token')
  })

  it('includes the channel in the request body', async () => {
    await postSlackMessage('#new-trips', { text: 'Hello' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.channel).toBe('#new-trips')
  })

  it('merges the payload into the request body', async () => {
    await postSlackMessage('#new-users', {
      text: 'fallback',
      blocks: [{ type: 'header' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toBe('fallback')
    expect(body.blocks).toEqual([{ type: 'header' }])
  })

  it('throws when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN
    await expect(postSlackMessage('#test', { text: 'x' })).rejects.toThrow('SLACK_BOT_TOKEN not configured')
  })

  it('logs an error when HTTP response is not ok', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    await postSlackMessage('#new-users', { text: 'x' })

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('logs an error when Slack API returns ok: false', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, error: 'channel_not_found' }),
    })

    await postSlackMessage('#new-users', { text: 'x' })

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('channel_not_found'))
    consoleSpy.mockRestore()
  })
})
