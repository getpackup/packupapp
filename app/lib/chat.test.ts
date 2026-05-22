import { describe, expect, it } from 'vitest'

import { initializeUserReadStatus } from './chat'

describe('initializeUserReadStatus', () => {
  it('returns correct defaults for a new user', () => {
    const status = initializeUserReadStatus('user-1')
    expect(status.userId).toBe('user-1')
    expect(status.lastReadAt).toBeDefined()
    expect(status.lastReadMessageId).toBe('')
    expect(status.isTyping).toBe(false)
  })
})
