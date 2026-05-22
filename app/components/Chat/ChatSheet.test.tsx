import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  })),
  default: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  })),
}))

vi.mock('../../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

const mockMarkChatReadAsync = vi.fn()
const mockSendMessageAsync = vi.fn()
const mockUpdateTypingAsync = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useParams: vi.fn(() => ({ id: 'trip-1' })) }
})

vi.mock('../../services/trips', () => ({
  useTripChatMessagesQuery: vi.fn(() => ({
    data: [
      {
        id: 'msg-1',
        userId: 'other-user',
        userName: 'otheruser',
        content: 'Hello',
        createdAt: Timestamp.fromDate(new Date('2026-01-01')),
        type: 'text',
        reactions: {},
      },
      {
        id: 'msg-2',
        userId: 'other-user',
        userName: 'otheruser',
        content: 'World',
        createdAt: Timestamp.fromDate(new Date('2026-01-02')),
        type: 'text',
        reactions: {},
      },
    ],
  })),
  useTripChatReadStatusQuery: vi.fn(() => ({ data: [] })),
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: mockSendMessageAsync })),
  useUpdateTypingStatus: vi.fn(() => ({ mutateAsync: mockUpdateTypingAsync })),
  useMarkChatRead: vi.fn(() => ({ mutateAsync: mockMarkChatReadAsync })),
  useDeleteChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

import { useAuth } from '../../contexts/auth/useAuth'
import { useIsAnonymous } from '../../lib/useIsAnonymous'
import { useTripChatMessagesQuery } from '../../services/trips'
import ChatSheet from './ChatSheet'

const baseTripProps = {
  trip: {
    tripId: 'trip-1',
    name: 'Test Trip',
    tripMembers: { u1: { status: 'Owner' } },
  } as any,
  users: [
    { id: 'u1', uid: 'u1', username: 'testuser', email: 'test@test.com', displayName: 'Test' },
    {
      id: 'other-user',
      uid: 'other-user',
      username: 'otheruser',
      email: 'other@test.com',
      displayName: 'Other',
    },
  ] as any[],
}

function renderComponent(props = baseTripProps) {
  return render(
    <MemoryRouter>
      <ChatSheet {...props} />
    </MemoryRouter>
  )
}

describe('ChatSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollTo = vi.fn()
  })

  describe('mark chat as read on open', () => {
    it('calls markChatRead with last message ID when sheet opens', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /trip chat/i }))

      expect(mockMarkChatReadAsync).toHaveBeenCalledWith({
        tripId: 'trip-1',
        lastReadMessageId: 'msg-2',
      })
    })

    it('calls markChatRead with empty string when no messages exist', async () => {
      vi.mocked(useTripChatMessagesQuery).mockReturnValue({ data: [] } as any)
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /trip chat/i }))

      expect(mockMarkChatReadAsync).toHaveBeenCalledWith({
        tripId: 'trip-1',
        lastReadMessageId: '',
      })
    })

    it('does not call markChatRead for anonymous users', async () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /trip chat/i }))

      expect(mockMarkChatReadAsync).not.toHaveBeenCalled()
    })

    it('does not call markChatRead when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        setUser: vi.fn(),
      } as any)
      ;(useAuth as any).mockReturnValue({ user: null })
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('button', { name: /trip chat/i }))

      expect(mockMarkChatReadAsync).not.toHaveBeenCalled()
    })
  })
})
