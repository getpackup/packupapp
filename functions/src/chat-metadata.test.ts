import { describe, expect, it, vi } from 'vitest'

import type { ChatMetadataWritePayload } from '../../app/types/Chat'
import type { ChatMetadataDeps } from './chat-metadata'
import { processChatMessage } from './chat-metadata'

function makeTimestamp(date = new Date()) {
  return { toDate: () => date, toMillis: () => date.getTime() } as any
}

function makeDeps(): { deps: ChatMetadataDeps; writeMetadata: ReturnType<typeof vi.fn> } {
  const writeMetadata = vi
    .fn<(data: ChatMetadataWritePayload) => Promise<void>>()
    .mockResolvedValue(undefined)
  return { deps: { writeMetadata }, writeMetadata }
}

describe('processChatMessage', () => {
  it('writes all required metadata fields', async () => {
    const ts = makeTimestamp()
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'u1', userName: 'Alice', content: 'Hello!', createdAt: ts },
      deps
    )

    expect(writeMetadata).toHaveBeenCalledOnce()
    expect(writeMetadata).toHaveBeenCalledWith({
      lastMessageAt: ts,
      lastMessageContent: 'Hello!',
      lastMessageUserId: 'u1',
      lastMessageUserName: 'Alice',
    })
  })

  it('stores full content when within the preview limit', async () => {
    const content = 'Short message'
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'u1', userName: 'Alice', content, createdAt: makeTimestamp() },
      deps
    )

    expect(writeMetadata.mock.calls[0][0].lastMessageContent).toBe(content)
  })

  it('truncates content to 100 characters for the preview', async () => {
    const content = 'a'.repeat(150)
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'u1', userName: 'Alice', content, createdAt: makeTimestamp() },
      deps
    )

    expect(writeMetadata.mock.calls[0][0].lastMessageContent).toBe('a'.repeat(100))
  })

  it('does not truncate content that is exactly 100 characters', async () => {
    const content = 'b'.repeat(100)
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'u1', userName: 'Alice', content, createdAt: makeTimestamp() },
      deps
    )

    expect(writeMetadata.mock.calls[0][0].lastMessageContent).toBe(content)
  })

  it('sets lastMessageAt to the message createdAt', async () => {
    const ts = makeTimestamp(new Date('2025-06-01T12:00:00Z'))
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'u1', userName: 'Alice', content: 'Hi', createdAt: ts },
      deps
    )

    expect(writeMetadata.mock.calls[0][0].lastMessageAt).toBe(ts)
  })

  it('handles system messages the same as user messages', async () => {
    const ts = makeTimestamp()
    const { deps, writeMetadata } = makeDeps()

    await processChatMessage(
      { userId: 'system', userName: 'System', content: 'Alice joined the trip.', createdAt: ts },
      deps
    )

    expect(writeMetadata).toHaveBeenCalledOnce()
    expect(writeMetadata.mock.calls[0][0].lastMessageUserId).toBe('system')
    expect(writeMetadata.mock.calls[0][0].lastMessageContent).toBe('Alice joined the trip.')
  })
})
