import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { User } from '../../../types/User'

vi.mock('../../../firebase/config', () => ({
  firebaseAuth: {},
  firestoreDb: {},
}))

vi.mock('../../../contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({
    user: { uid: 'current-user', displayName: 'Me', username: 'me', email: 'me@test.com' },
  })),
}))

vi.mock('../../../services/friends', () => ({
  useFriendUsersQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock('../../../services/trips', () => ({
  useCreateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('../../../services/users', () => ({
  useIncrementTagCounts: vi.fn(() => ({ mutate: vi.fn() })),
}))

const mockUseFriendSearch = vi.fn()
vi.mock('../../../services/useFriendSearch', () => ({
  useFriendSearch: (...args: unknown[]) => mockUseFriendSearch(...args),
}))

import { useFriendUsersQuery } from '../../../services/friends'
import MembersStep from './MembersStep'

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

const currentUser = makeUser({
  uid: 'current-user',
  id: 'current-user',
  displayName: 'Me',
  username: 'me',
  email: 'me@test.com',
})

describe('MembersStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [],
      isLoading: false,
    })
    vi.mocked(useFriendUsersQuery).mockReturnValue({ data: [], isLoading: false } as any)
  })

  it('renders UserSearchCombobox search input', () => {
    render(
      <MembersStep
        tripMembers={[currentUser]}
        setTripMembers={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('displays existing trip members with remove buttons', () => {
    const member = makeUser({ uid: 'member-1', id: 'member-1', displayName: 'Alice', username: 'alice' })

    render(
      <MembersStep
        tripMembers={[currentUser, member]}
        setTripMembers={vi.fn()}
      />
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove alice/i })).toBeInTheDocument()
  })

  it('does not show remove button for current user', () => {
    render(
      <MembersStep
        tripMembers={[currentUser]}
        setTripMembers={vi.fn()}
      />
    )

    expect(screen.getByText('Me')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove me/i })).not.toBeInTheDocument()
  })

  it('removes a member when remove button is clicked', async () => {
    const setTripMembers = vi.fn()
    const member = makeUser({ uid: 'member-1', id: 'member-1', displayName: 'Alice', username: 'alice' })

    render(
      <MembersStep
        tripMembers={[currentUser, member]}
        setTripMembers={setTripMembers}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /remove alice/i }))
    expect(setTripMembers).toHaveBeenCalledWith([currentUser])
  })

  it('appends selected user to tripMembers via onSelect', async () => {
    const setTripMembers = vi.fn()
    const friend = makeUser({ uid: 'f1', id: 'f1', displayName: 'Bob', username: 'bob' })

    mockUseFriendSearch.mockReturnValue({
      friendHits: [friend],
      allUserHits: [],
      isLoading: false,
    })

    render(
      <MembersStep
        tripMembers={[currentUser]}
        setTripMembers={setTripMembers}
      />
    )

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)
    await userEvent.click(screen.getByRole('button', { name: /add bob/i }))

    expect(setTripMembers).toHaveBeenCalledWith([currentUser, friend])
  })

  it('shows status badges for already-selected members in dropdown', async () => {
    const member = makeUser({ uid: 'member-1', id: 'member-1', displayName: 'Alice', username: 'alice' })

    mockUseFriendSearch.mockReturnValue({
      friendHits: [member],
      allUserHits: [],
      isLoading: false,
    })

    render(
      <MembersStep
        tripMembers={[currentUser, member]}
        setTripMembers={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText(/search/i)
    await userEvent.click(input)

    const badges = screen.getAllByText('Invited')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('passes current user uid in excludeUids', async () => {
    const friend = makeUser({ uid: 'f1', id: 'f1', displayName: 'Bob', username: 'bob' })

    vi.mocked(useFriendUsersQuery).mockReturnValue({ data: [friend], isLoading: false } as any)
    mockUseFriendSearch.mockReturnValue({
      friendHits: [friend],
      allUserHits: [],
      isLoading: false,
    })

    render(
      <MembersStep
        tripMembers={[currentUser]}
        setTripMembers={vi.fn()}
      />
    )

    expect(mockUseFriendSearch).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserUid: 'current-user' })
    )
  })
})
