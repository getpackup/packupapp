import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUpdateTrip = vi.fn(() => Promise.resolve())
const mockSendMessage = vi.fn(() => Promise.resolve())
const mockSendFriendReq = vi.fn(() => Promise.resolve())
const mockFetcherSubmit = vi.fn(() => Promise.resolve())

vi.mock('../../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('../../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
  default: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
}))

vi.mock('../../services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: mockUpdateTrip })),
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: mockSendMessage })),
}))

vi.mock('../../services/friends', () => ({
  useFriendsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  usePendingFriendshipsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSendFriendRequest: vi.fn(() => ({ mutateAsync: mockSendFriendReq, isPending: false })),
}))

vi.mock('../../services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: null })),
}))

vi.mock('../../services/algoliaSearch', () => ({
  algoliaSearch: {
    search: vi.fn(() => Promise.resolve({ results: [{ hits: [] }] })),
  },
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'trip1' })),
    useFetcher: vi.fn(() => ({ submit: mockFetcherSubmit })),
  }
})

import { useFriendsQuery, usePendingFriendshipsQuery, useSendFriendRequest } from '../../services/friends'
import { useIsAnonymous } from '../../lib/useIsAnonymous'
import { useUserByIdQuery } from '../../services/users'
import { algoliaSearch } from '../../services/algoliaSearch'
import { AddTripPartyMember } from './AddTripPartyMember'

const GATE_MESSAGE = 'Create an account to invite friends and assign gear to your crew.'

function renderComponent(tripMembers: any[] = []) {
  return render(
    <MemoryRouter>
      <AddTripPartyMember trip={{ tripId: 'trip1', name: 'Test Trip', startingPoint: 'Denver', description: 'Fun', tags: ['hiking'], startDate: { seconds: 1700000000 }, endDate: { seconds: 1700100000 } } as any} tripMembers={tripMembers} />
    </MemoryRouter>
  )
}

describe('AddTripPartyMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useIsAnonymous).mockReturnValue(false)
  })

  it('shows a visible add-member button for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })

  it('opens Account Gate modal when anonymous user clicks the button', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByText(GATE_MESSAGE)).toBeInTheDocument()
  })

  it('shows "Create account" CTA in the gate modal', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/signup')
  })

  it('renders the popover trigger for registered users', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })

  describe('friends-first invite', () => {
    it('shows friends above the search input when popover opens', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({
        data: [
          { id: 'u1_u2', uids: ['u1', 'u2'], requesterUid: 'u1', status: 'accepted', requestedAt: {} as any },
        ],
        isLoading: false,
      } as any)
      vi.mocked(useUserByIdQuery).mockReturnValue({
        data: { uid: 'u2', username: 'frienduser', email: 'friend@test.com', displayName: 'Friend User' },
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      expect(screen.getByText('Friends')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add frienduser to trip/i })).toBeInTheDocument()
    })

    it('shows bundled friend request checkbox for non-friend search results', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(usePendingFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(algoliaSearch.search).mockResolvedValue({
        results: [{ hits: [{ objectID: 'obj1', uid: 'stranger1', username: 'stranger', email: 's@test.com' }] }],
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      const input = screen.getByPlaceholderText(/search by username/i)
      await userEvent.type(input, 'stranger')

      await waitFor(() => {
        expect(screen.getByText(/also send stranger a friend request/i)).toBeInTheDocument()
      })
    })

    it('does not send friend request when checkbox is unchecked', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(usePendingFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(algoliaSearch.search).mockResolvedValue({
        results: [{ hits: [{ objectID: 'obj1', uid: 'stranger1', username: 'stranger', email: 's@test.com' }] }],
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      const input = screen.getByPlaceholderText(/search by username/i)
      await userEvent.type(input, 'stranger')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add stranger to trip/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /add stranger to trip/i }))

      await waitFor(() => {
        expect(mockUpdateTrip).toHaveBeenCalled()
      })
      expect(mockSendFriendReq).not.toHaveBeenCalled()
    })

    it('sends both trip invitation and friend request when checkbox is checked', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(usePendingFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(algoliaSearch.search).mockResolvedValue({
        results: [{ hits: [{ objectID: 'obj1', uid: 'stranger1', username: 'stranger', email: 's@test.com' }] }],
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      const input = screen.getByPlaceholderText(/search by username/i)
      await userEvent.type(input, 'stranger')

      await waitFor(() => {
        expect(screen.getByText(/also send stranger a friend request/i)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('checkbox'))
      await userEvent.click(screen.getByRole('button', { name: /add stranger to trip/i }))

      await waitFor(() => {
        expect(mockUpdateTrip).toHaveBeenCalled()
      })
      await waitFor(() => {
        expect(mockSendFriendReq).toHaveBeenCalledWith({ senderUid: 'u1', recipientUid: 'stranger1' })
      })
    })

    it('filters out friends from Algolia search results', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({
        data: [
          { id: 'u1_u2', uids: ['u1', 'u2'], requesterUid: 'u1', status: 'accepted', requestedAt: {} as any },
        ],
        isLoading: false,
      } as any)
      vi.mocked(usePendingFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(useUserByIdQuery).mockReturnValue({
        data: { uid: 'u2', username: 'frienduser', email: 'friend@test.com', displayName: 'Friend User' },
      } as any)
      vi.mocked(algoliaSearch.search).mockResolvedValue({
        results: [{ hits: [
          { objectID: 'obj1', uid: 'u2', username: 'frienduser', email: 'friend@test.com' },
          { objectID: 'obj2', uid: 'stranger1', username: 'stranger', email: 's@test.com' },
        ] }],
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      const input = screen.getByPlaceholderText(/search by username/i)
      await userEvent.type(input, 'friend')

      await waitFor(() => {
        expect(screen.getByText(/also send stranger a friend request/i)).toBeInTheDocument()
      })
      expect(screen.queryByText(/also send frienduser a friend request/i)).not.toBeInTheDocument()
    })

    it('filters out users with pending friend requests from Algolia results', async () => {
      vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: false } as any)
      vi.mocked(usePendingFriendshipsQuery).mockReturnValue({
        data: [
          { id: 'u1_u3', uids: ['u1', 'u3'], requesterUid: 'u1', status: 'pending', requestedAt: {} as any },
        ],
        isLoading: false,
      } as any)
      vi.mocked(algoliaSearch.search).mockResolvedValue({
        results: [{ hits: [
          { objectID: 'obj1', uid: 'u3', username: 'pendinguser', email: 'p@test.com' },
          { objectID: 'obj2', uid: 'stranger1', username: 'stranger', email: 's@test.com' },
        ] }],
      } as any)

      renderComponent()
      await userEvent.click(screen.getByRole('button', { name: /add member/i }))

      const input = screen.getByPlaceholderText(/search by username/i)
      await userEvent.type(input, 'user')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add stranger to trip/i })).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /add pendinguser to trip/i })).not.toBeInTheDocument()
    })
  })
})
