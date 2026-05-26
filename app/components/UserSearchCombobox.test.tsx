import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { TripMember } from '~/types/TripMember'
import { TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

const mockUseFriendSearch = vi.fn()

vi.mock('~/services/useFriendSearch', () => ({
  useFriendSearch: (...args: unknown[]) => mockUseFriendSearch(...args),
}))

import { UserSearchCombobox } from './UserSearchCombobox'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'uid-1',
    id: 'uid-1',
    displayName: 'Test User',
    username: 'testuser',
    email: 'test@test.com',
    ...overrides,
  }
}

function makeTripMember(overrides: Partial<TripMember> = {}): TripMember {
  return {
    uid: 'uid-1',
    status: TripMemberStatus.Accepted,
    invitedAt: { seconds: 0, nanoseconds: 0 } as TripMember['invitedAt'],
    ...overrides,
  }
}

const defaultProps = {
  onSelect: vi.fn(),
  excludeUids: ['current-user'],
  alreadyAddedMembers: [] as TripMember[],
  friends: [] as User[],
  currentUserUid: 'current-user',
}

describe('UserSearchCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [],
      isLoading: false,
    })
  })

  it('shows Friends section with friend names on focus when friends exist', async () => {
    const friends = [
      makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' }),
      makeUser({ uid: 'f2', id: 'f2', displayName: 'Bob', username: 'bob' }),
    ]
    mockUseFriendSearch.mockReturnValue({
      friendHits: friends,
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={friends} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)

    expect(screen.getByText('Friends')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows "No friends yet" hint when user has no friends', async () => {
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[]} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)

    expect(screen.getByText(/no friends yet/i)).toBeInTheDocument()
  })

  it('shows the All Users section when query is at least 1 character', async () => {
    const friends = [makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })]
    mockUseFriendSearch.mockReturnValue({
      friendHits: friends,
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={friends} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'a')

    expect(screen.queryByText('All Users')).toBeInTheDocument()
  })

  it('shows both Friends and All Users sections when query is 2+ characters', async () => {
    const friends = [makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })]
    const allUsers = [makeUser({ uid: 'u1', id: 'u1', displayName: 'Alicia', username: 'alicia' })]
    mockUseFriendSearch.mockReturnValue({
      friendHits: friends,
      allUserHits: allUsers,
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={friends} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'al')

    expect(screen.getByText('Friends')).toBeInTheDocument()
    expect(screen.getByText('All Users')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Alicia')).toBeInTheDocument()
  })

  it('hides Friends section when no friends match the query', async () => {
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [makeUser({ uid: 'u1', id: 'u1', displayName: 'Zara', username: 'zara' })],
      isLoading: false,
    })

    render(
      <UserSearchCombobox
        {...defaultProps}
        friends={[makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })]}
      />
    )

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'za')

    expect(screen.queryByText('Friends')).not.toBeInTheDocument()
    expect(screen.getByText('All Users')).toBeInTheDocument()
  })

  it('shows status badge instead of add button for already-added trip members', async () => {
    const memberUser = makeUser({ uid: 'm1', id: 'm1', displayName: 'Member', username: 'member' })
    const tripMember = makeTripMember({ uid: 'm1', status: TripMemberStatus.Accepted })

    mockUseFriendSearch.mockReturnValue({
      friendHits: [memberUser],
      allUserHits: [],
      isLoading: false,
    })

    render(
      <UserSearchCombobox
        {...defaultProps}
        friends={[memberUser]}
        alreadyAddedMembers={[tripMember]}
      />
    )

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)

    expect(screen.getByText('Trip Member')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument()
  })

  it('shows "Add as friend" checkbox for non-friend non-member results', async () => {
    const stranger = makeUser({
      uid: 'u1',
      id: 'u1',
      displayName: 'Stranger',
      username: 'stranger',
    })
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [stranger],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[]} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'st')

    expect(screen.getByText(/Add as friend/i)).toBeInTheDocument()
  })

  it('does not show friend request checkbox for friends in All Users section', async () => {
    const friend = makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })
    mockUseFriendSearch.mockReturnValue({
      friendHits: [friend],
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[friend]} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'al')

    expect(screen.queryByText(/also send.*friend request/i)).not.toBeInTheDocument()
  })

  it('calls onSelect with the user when add button is clicked', async () => {
    const onSelect = vi.fn()
    const friend = makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })
    mockUseFriendSearch.mockReturnValue({
      friendHits: [friend],
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[friend]} onSelect={onSelect} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.click(screen.getByLabelText('Add to trip'))

    expect(onSelect).toHaveBeenCalledWith({ ...friend, sendFriendRequest: false })
  })

  it('container stays open after a selection', async () => {
    const friend = makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' })
    mockUseFriendSearch.mockReturnValue({
      friendHits: [friend],
      allUserHits: [],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[friend]} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.click(screen.getByLabelText('Add to trip'))

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
  })

  it('clears friend request checkbox state per-UID when toggled', async () => {
    const stranger = makeUser({
      uid: 'u1',
      id: 'u1',
      displayName: 'Stranger',
      username: 'stranger',
    })
    const onSelect = vi.fn()
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [stranger],
      isLoading: false,
    })

    render(<UserSearchCombobox {...defaultProps} friends={[]} onSelect={onSelect} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'st')

    const checkbox = screen.getByRole('checkbox')
    await userEvent.click(checkbox)
    await userEvent.click(screen.getByLabelText('Add to trip'))

    expect(onSelect).toHaveBeenCalledWith({ ...stranger, sendFriendRequest: true })
  })

  it('passes query to useFriendSearch', async () => {
    render(<UserSearchCombobox {...defaultProps} friends={[]} />)

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.type(input, 'test')

    expect(mockUseFriendSearch).toHaveBeenCalledWith(expect.objectContaining({ query: 'test' }))
  })
})
