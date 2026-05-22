import { describe, expect, it } from 'vitest'

import { initializeUserReadStatus } from './chat'

describe('initializeUserReadStatus', () => {
  it('does not include unreadCount', () => {
    const status = initializeUserReadStatus('user-1')
    expect(status).not.toHaveProperty('unreadCount')
  })

  it('returns userId, lastReadAt, lastReadMessageId, and isTyping', () => {
    const status = initializeUserReadStatus('user-1')
    expect(status.userId).toBe('user-1')
    expect(status.lastReadAt).toBeDefined()
    expect(status.lastReadMessageId).toBe('')
    expect(status.isTyping).toBe(false)
  })
})
