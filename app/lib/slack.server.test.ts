import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { postToSlack } from './slack.server'

describe('postToSlack', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
  })

  it('calls chat.postMessage with the correct URL', async () => {
    await postToSlack('#feedback', { text: 'hello' })
    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('https://slack.com/api/chat.postMessage')
  })

  it('sends Authorization header with bot token', async () => {
    await postToSlack('#feedback', { text: 'hello' })
    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['Authorization']).toBe('Bearer xoxb-test-token')
  })

  it('includes channel and payload fields in the request body', async () => {
    await postToSlack('#feedback', { text: 'test message', blocks: [] })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.channel).toBe('#feedback')
    expect(body.text).toBe('test message')
  })

  it('throws and logs when HTTP response is not ok', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValue(new Response(null, { status: 500 }))
    await expect(postToSlack('#feedback', { text: 'hello' })).rejects.toThrow()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('throws and logs when Slack API returns ok: false', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'channel_not_found' }), { status: 200 }),
    )
    await expect(postToSlack('#feedback', { text: 'hello' })).rejects.toThrow()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('propagates fetch rejection', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    await expect(postToSlack('#feedback', { text: 'hello' })).rejects.toThrow('Network error')
  })
})
