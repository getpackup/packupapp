import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('../../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
  default: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
}))

vi.mock('../../services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('../../services/friends', () => ({
  useFriendsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSendFriendRequest: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('../../services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: null })),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'trip1' })),
    useFetcher: vi.fn(() => ({ submit: vi.fn() })),
  }
})

import { useIsAnonymous } from '../../lib/useIsAnonymous'
import { AddTripPartyMember } from './AddTripPartyMember'

const GATE_MESSAGE = 'Create an account to invite friends and assign gear to your crew.'

function renderComponent() {
  return render(
    <MemoryRouter>
      <AddTripPartyMember trip={{ tripId: 'trip1' } as any} tripMembers={[]} />
    </MemoryRouter>
  )
}

describe('AddTripPartyMember', () => {
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
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderComponent()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })
})
