import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip } from '~/types/Trip'

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('~/lib/usePlan', () => ({
  usePlan: vi.fn(() => ({ plan: 'pro', isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined })),
}))

vi.mock('~/lib/use-screen-size', () => ({
  useScreenSize: vi.fn(() => ({
    isXSmallBreakpoint: true,
    isSmallBreakpoint: true,
    isMediumBreakpoint: false,
    isLargeBreakpoint: false,
    isXlBreakpoint: false,
    is2xlBreakpoint: false,
  })),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
  default: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
}))

vi.mock('~/services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('~/services/chat', () => ({
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('~/services/friends', () => ({
  useFriendsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSendFriendRequest: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('~/services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: null })),
  userKeys: { byId: (id: string) => ['users', id] },
  fetchUserById: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueries: vi.fn(() => []),
  }
})

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'trip1' })),
  }
})

import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { usePlan } from '~/lib/usePlan'
import { useScreenSize } from '~/lib/use-screen-size'
import { TripMemberStatus, type TripMember } from '~/types/TripMember'
import { AddTripMember } from './AddTripMember'

let memberCounter = 0
function makeMember(status: TripMemberStatus = TripMemberStatus.Accepted): TripMember {
  return {
    uid: `uid-${++memberCounter}`,
    invitedAt: { seconds: 0, nanoseconds: 0 } as any,
    status,
  }
}

const GATE_MESSAGE = 'Create an account to invite friends and assign gear to your crew.'

const PRO_PLAN = { plan: 'pro' as const, isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }
const FREE_PLAN = { plan: 'free' as const, isPro: false, isFree: true, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }

function renderComponent() {
  return render(
    <MemoryRouter>
      <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={[]} />
    </MemoryRouter>
  )
}

describe('AddTripMember', () => {
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

  it('renders a dialog trigger for registered users on desktop', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: true,
      isLargeBreakpoint: true,
      isXlBreakpoint: true,
      is2xlBreakpoint: true,
    })
    renderComponent()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })

  it('opens a dialog with "Add Trip Member" title on desktop', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: true,
      isLargeBreakpoint: true,
      isXlBreakpoint: true,
      is2xlBreakpoint: true,
    })
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByText('Add Trip Member')).toBeInTheDocument()
  })

  it('renders a sheet trigger for registered users on mobile', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: false,
      isLargeBreakpoint: false,
      isXlBreakpoint: false,
      is2xlBreakpoint: false,
    })
    renderComponent()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })

  it('opens a drawer with "Add Trip Member" title on mobile', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: false,
      isLargeBreakpoint: false,
      isXlBreakpoint: false,
      is2xlBreakpoint: false,
    })
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByText('Add Trip Member')).toBeInTheDocument()
  })

  it('mounts UserSearchCombobox inside the container on desktop', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: true,
      isLargeBreakpoint: true,
      isXlBreakpoint: true,
      is2xlBreakpoint: true,
    })
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

describe('AddTripMember — Free Plan member cap', () => {
  beforeEach(() => {
    memberCounter = 0
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    vi.mocked(useScreenSize).mockReturnValue({
      isXSmallBreakpoint: true,
      isSmallBreakpoint: true,
      isMediumBreakpoint: true,
      isLargeBreakpoint: true,
      isXlBreakpoint: true,
      is2xlBreakpoint: true,
    })
  })

  it('Free plan with 2 active members shows an unlocked, enabled search field', async () => {
    const members = [makeMember(TripMemberStatus.Owner), makeMember(TripMemberStatus.Accepted)]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search/i)).toBeEnabled()
  })

  it('Free plan with exactly 3 active members still shows an unlocked trigger button', () => {
    const members = [
      makeMember(TripMemberStatus.Owner),
      makeMember(TripMemberStatus.Accepted),
      makeMember(TripMemberStatus.Accepted),
    ]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
  })

  it('Free plan at member cap shows the inline gate with a disabled search field once the dialog opens', async () => {
    const members = [
      makeMember(TripMemberStatus.Owner),
      makeMember(TripMemberStatus.Accepted),
      makeMember(TripMemberStatus.Accepted),
    ]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByTestId('plan-gate-locked')).toBeInTheDocument()
    expect(
      screen.getByText(/Bring the whole group - no cap on who joins the trip\./)
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search/i)).toBeDisabled()
  })

  it('Pro plan with 4 active members shows an unlocked, enabled search field', async () => {
    vi.mocked(usePlan).mockReturnValue(PRO_PLAN)
    const members = [
      makeMember(TripMemberStatus.Owner),
      makeMember(TripMemberStatus.Accepted),
      makeMember(TripMemberStatus.Accepted),
      makeMember(TripMemberStatus.Accepted),
    ]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search/i)).toBeEnabled()
  })

  it('Declined and removed members do not count toward the cap', async () => {
    const members = [
      makeMember(TripMemberStatus.Owner),
      makeMember(TripMemberStatus.Declined),
      makeMember(TripMemberStatus.Removed),
    ]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
  })

  it('Pending members do count toward the cap', async () => {
    const members = [
      makeMember(TripMemberStatus.Owner),
      makeMember(TripMemberStatus.Pending),
      makeMember(TripMemberStatus.Pending),
    ]
    render(
      <MemoryRouter>
        <AddTripMember trip={{ tripId: 'trip1' } as Trip} tripMembers={members} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByTestId('plan-gate-locked')).toBeInTheDocument()
  })
})
