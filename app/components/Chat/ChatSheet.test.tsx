import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/contexts/auth/useAuth', () => {
  const fn = vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  }))
  return { useAuth: fn, default: fn }
})

Element.prototype.scrollTo = vi.fn()

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

const { mockUseHasUnreadChat } = vi.hoisted(() => ({
  mockUseHasUnreadChat: vi.fn(() => false),
}))
vi.mock('../../lib/useHasUnreadChat', () => ({
  useHasUnreadChat: mockUseHasUnreadChat,
}))

const mockMarkChatReadAsync = vi.fn()
const mockSendMessageAsync = vi.fn()
const mockUpdateTypingAsync = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useParams: vi.fn(() => ({ id: 'trip-1' })) }
})

vi.mock('~/services/chat', () => ({
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

const { mockRequestPushPermission } = vi.hoisted(() => ({
  mockRequestPushPermission: vi.fn(),
}))

vi.mock('~/lib/pushPermission', () => ({
  requestPushPermission: mockRequestPushPermission,
}))

import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useTripChatMessagesQuery } from '~/services/chat'
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

function renderComponent(
  props = baseTripProps,
  open?: boolean,
  onOpenChange?: (open: boolean) => void
) {
  return render(
    <MemoryRouter>
      <ChatSheet {...props} open={open} onOpenChange={onOpenChange} />
    </MemoryRouter>
  )
}

describe('ChatSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
    } as any)
    vi.mocked(useIsAnonymous).mockReturnValue(false)
  })

  describe('mark chat as read on open', () => {
    it('calls markChatRead with last message ID when open becomes true', () => {
      renderComponent(baseTripProps, true)

      expect(mockMarkChatReadAsync).toHaveBeenCalledWith({
        tripId: 'trip-1',
        lastReadMessageId: 'msg-2',
      })
    })

    it('calls markChatRead with empty string when no messages exist', () => {
      vi.mocked(useTripChatMessagesQuery).mockReturnValue({ data: [] } as any)
      renderComponent(baseTripProps, true)

      expect(mockMarkChatReadAsync).toHaveBeenCalledWith({
        tripId: 'trip-1',
        lastReadMessageId: '',
      })
    })

    it('does not call markChatRead for anonymous users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      renderComponent(baseTripProps, true)

      expect(mockMarkChatReadAsync).not.toHaveBeenCalled()
    })

    it('does not call markChatRead when user is not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any)
      renderComponent(baseTripProps, true)

      expect(mockMarkChatReadAsync).not.toHaveBeenCalled()
    })
  })

  describe('push permission prompt on chat open', () => {
    it('calls requestPushPermission with userId when open becomes true', () => {
      renderComponent(baseTripProps, true)

      expect(mockRequestPushPermission).toHaveBeenCalledWith('u1')
    })

    it('does not request push permission for anonymous users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      renderComponent(baseTripProps, true)

      expect(mockRequestPushPermission).not.toHaveBeenCalled()
    })

    it('does not request push permission when user is not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any)
      renderComponent(baseTripProps, true)

      expect(mockRequestPushPermission).not.toHaveBeenCalled()
    })
  })

  describe('open prop', () => {
    it('is closed by default when open is not provided', () => {
      renderComponent()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('opens when open is true', () => {
      renderComponent(baseTripProps, true)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /trip chat/i })).toBeInTheDocument()
    })

    it('calls onOpenChange with true when trigger is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderComponent(baseTripProps, false, onOpenChange)

      await user.click(screen.getByRole('button', { name: /trip chat/i }))
      expect(onOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('unread badge', () => {
    it('shows dot badge when useHasUnreadChat returns true', () => {
      mockUseHasUnreadChat.mockReturnValue(true)
      renderComponent()
      expect(screen.getByTestId('unread-badge')).toBeInTheDocument()
    })

    it('does not show dot badge when useHasUnreadChat returns false', () => {
      mockUseHasUnreadChat.mockReturnValue(false)
      renderComponent()
      expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument()
    })

    it('passes tripId to useHasUnreadChat', () => {
      renderComponent()
      expect(mockUseHasUnreadChat).toHaveBeenCalledWith('trip-1')
    })
  })
})
