import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('~/contexts/auth/useAuth', () => {
  const fn = vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  }))
  return { useAuth: fn, default: fn }
})

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

const { mockUseHasUnreadChat } = vi.hoisted(() => ({
  mockUseHasUnreadChat: vi.fn(() => false),
}))
vi.mock('~/lib/useHasUnreadChat', () => ({
  useHasUnreadChat: mockUseHasUnreadChat,
}))

vi.mock('~/services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) })),
  useTripMembersQuery: vi.fn(() => ({ data: [] })),
}))

vi.mock('~/services/chat', () => ({
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('~/lib/use-screen-size', () => ({
  useScreenSize: vi.fn(() => ({ isLargeBreakpoint: false })),
}))

import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateTrip } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'
import TripCard from './TripCard'

const ts = Timestamp.fromDate(new Date('2026-06-01'))

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    tripId: 't1',
    name: 'Backcountry Trip',
    description: '',
    startDate: ts,
    endDate: Timestamp.fromDate(new Date('2026-06-05')),
    lat: 0,
    lng: 0,
    owner: 'u1',
    startingPoint: 'Trailhead',
    tags: [],
    timezoneOffset: 0,
    tripLength: 4,
    season: 'summer',
    tripMembers: {
      u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts },
    },
    ...overrides,
  }
}

function renderTripCard(tripOverrides: Partial<Trip> = {}, isPending = false) {
  return render(
    <MemoryRouter>
      <TripCard trip={makeTrip(tripOverrides)} isPending={isPending} />
    </MemoryRouter>
  )
}

describe('TripCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
    } as any)
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    mockUseHasUnreadChat.mockReturnValue(false)
  })

  describe('unread chat badge', () => {
    it('shows dot badge when useHasUnreadChat returns true', () => {
      mockUseHasUnreadChat.mockReturnValue(true)
      renderTripCard()
      expect(screen.getByTestId('tripcard-unread-badge')).toBeInTheDocument()
    })

    it('does not show dot badge when useHasUnreadChat returns false', () => {
      mockUseHasUnreadChat.mockReturnValue(false)
      renderTripCard()
      expect(screen.queryByTestId('tripcard-unread-badge')).not.toBeInTheDocument()
    })

    it('does not show badge on pending trip cards', () => {
      mockUseHasUnreadChat.mockReturnValue(true)
      renderTripCard({}, true)
      expect(screen.queryByTestId('tripcard-unread-badge')).not.toBeInTheDocument()
    })

    it('does not show badge for anonymous users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      mockUseHasUnreadChat.mockReturnValue(false)
      renderTripCard()
      expect(screen.queryByTestId('tripcard-unread-badge')).not.toBeInTheDocument()
    })

    it('passes tripId to useHasUnreadChat', () => {
      renderTripCard({ tripId: 'trip-xyz' })
      expect(mockUseHasUnreadChat).toHaveBeenCalledWith('trip-xyz')
    })
  })

  describe('invitation acceptance', () => {
    it('navigates to /trips/:id?add-gear=open when accepting', async () => {
      const user = userEvent.setup()
      vi.mocked(useUpdateTrip).mockReturnValue({
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      } as any)

      renderTripCard(
        {
          tripId: 't1',
          tripMembers: { u1: { uid: 'u1', status: TripMemberStatus.Pending, invitedAt: ts } },
        },
        true
      )

      await user.click(screen.getByRole('button', { name: /accept/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/trips/t1?add-gear=open')
    })
  })
})
