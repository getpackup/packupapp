import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockDeleteTripAsync = vi.fn()
vi.mock('../../services/trips', () => ({
  useDeleteTrip: vi.fn(() => ({
    mutateAsync: mockDeleteTripAsync,
    isPending: false,
  })),
  useUpdateTrip: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}))

import { useAuth } from '../../contexts/auth/useAuth'
import { TripMemberStatus } from '../../types/TripMember'
import type { Trip } from '../../types/Trip'
import { TripSettings } from './TripSettings'

const ts = Timestamp.fromDate(new Date('2026-06-01'))

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    tripId: 't1',
    name: 'Backcountry Trip',
    description: '',
    startDate: ts,
    endDate: ts,
    lat: 0,
    lng: 0,
    owner: 'owner-uid',
    startingPoint: 'Trailhead',
    tags: [],
    timezoneOffset: 0,
    tripLength: 1,
    season: 'summer',
    tripMembers: {
      'owner-uid': {
        uid: 'owner-uid',
        status: TripMemberStatus.Owner,
        invitedAt: ts,
      },
      'member-uid': {
        uid: 'member-uid',
        status: TripMemberStatus.Accepted,
        invitedAt: ts,
      },
    },
    ...overrides,
  }
}

function renderAsOwner(tripOverrides: Partial<Trip> = {}, userOverrides: Record<string, unknown> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      uid: 'owner-uid',
      displayName: 'Owner',
      email: 'owner@test.com',
      username: 'owner',
      id: 'owner-uid',
      ...userOverrides,
    },
    setUser: vi.fn(),
  } as any)
  return render(
    <MemoryRouter>
      <TripSettings trip={makeTrip(tripOverrides)} />
    </MemoryRouter>
  )
}

function renderAsMember(tripOverrides: Partial<Trip> = {}, userOverrides: Record<string, unknown> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      uid: 'member-uid',
      displayName: 'Member',
      email: 'member@test.com',
      username: 'member',
      id: 'member-uid',
      ...userOverrides,
    },
    setUser: vi.fn(),
  } as any)
  return render(
    <MemoryRouter>
      <TripSettings trip={makeTrip(tripOverrides)} />
    </MemoryRouter>
  )
}

describe('TripSettings', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockDeleteTripAsync.mockReset()
  })

  describe('entry point', () => {
    it('renders a settings trigger button', () => {
      renderAsOwner()
      expect(screen.getByRole('button', { name: /trip settings/i })).toBeInTheDocument()
    })
  })

  describe('owner view', () => {
    it('shows Delete Trip section after opening modal', async () => {
      const user = userEvent.setup()
      renderAsOwner()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.getByText(/delete trip/i)).toBeInTheDocument()
    })

    it('does not show Leave Trip for owner', async () => {
      const user = userEvent.setup()
      renderAsOwner()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.queryByText(/leave trip/i)).not.toBeInTheDocument()
    })

    it('delete confirm button is disabled until DELETE is typed', async () => {
      const user = userEvent.setup()
      renderAsOwner()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      const confirmBtn = screen.getByRole('button', { name: /confirm delete/i })
      expect(confirmBtn).toBeDisabled()
      await user.type(screen.getByPlaceholderText(/type DELETE/i), 'DELETE')
      expect(confirmBtn).toBeEnabled()
    })

    it('confirming delete archives trip and navigates to /trips', async () => {
      const user = userEvent.setup()
      renderAsOwner()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      await user.type(screen.getByPlaceholderText(/type DELETE/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /confirm delete/i }))
      expect(mockDeleteTripAsync).toHaveBeenCalledWith({ tripId: 't1' })
      expect(mockNavigate).toHaveBeenCalledWith('/trips')
    })
  })

  describe('non-owner member view', () => {
    it('shows Leave Trip section', async () => {
      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.getByText(/leave trip/i)).toBeInTheDocument()
    })

    it('does not show Delete Trip for non-owner', async () => {
      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.queryByText(/delete trip/i)).not.toBeInTheDocument()
    })

    it('leave confirm button is disabled until LEAVE is typed', async () => {
      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      const confirmBtn = screen.getByRole('button', { name: /confirm leave/i })
      expect(confirmBtn).toBeDisabled()
      await user.type(screen.getByPlaceholderText(/type LEAVE/i), 'LEAVE')
      expect(confirmBtn).toBeEnabled()
    })

    it('confirming leave updates member status and navigates away', async () => {
      const { useUpdateTrip } = await import('../../services/trips')
      const mockUpdateAsync = vi.fn()
      vi.mocked(useUpdateTrip).mockReturnValue({ mutateAsync: mockUpdateAsync } as any)

      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      await user.type(screen.getByPlaceholderText(/type LEAVE/i), 'LEAVE')
      await user.click(screen.getByRole('button', { name: /confirm leave/i }))
      expect(mockUpdateAsync).toHaveBeenCalledWith({
        data: {
          [`tripMembers.member-uid`]: expect.objectContaining({
            status: TripMemberStatus.Left,
          }),
        },
      })
      expect(mockNavigate).toHaveBeenCalledWith('/trips')
    })
  })

  describe('safety itinerary opt-out toggle', () => {
    it('shows the safety itinerary toggle for owner', async () => {
      const user = userEvent.setup()
      renderAsOwner()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.getByRole('checkbox', { name: /safety itinerary/i })).toBeInTheDocument()
    })

    it('shows the safety itinerary toggle for non-owner', async () => {
      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.getByRole('checkbox', { name: /safety itinerary/i })).toBeInTheDocument()
    })

    it('toggle reflects current safetyItineraryOptedOut value', async () => {
      const user = userEvent.setup()
      renderAsMember({
        tripMembers: {
          'owner-uid': { uid: 'owner-uid', status: TripMemberStatus.Owner, invitedAt: ts },
          'member-uid': {
            uid: 'member-uid',
            status: TripMemberStatus.Accepted,
            invitedAt: ts,
            safetyItineraryOptedOut: true,
          },
        },
      })
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      const checkbox = screen.getByRole('checkbox', { name: /safety itinerary/i })
      expect(checkbox).not.toBeChecked()
    })

    it('clicking toggle calls updateTrip with safetyItineraryOptedOut', async () => {
      const { useUpdateTrip } = await import('../../services/trips')
      const mockUpdateAsync = vi.fn()
      vi.mocked(useUpdateTrip).mockReturnValue({ mutateAsync: mockUpdateAsync } as any)

      const user = userEvent.setup()
      renderAsMember()
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      await user.click(screen.getByRole('checkbox', { name: /safety itinerary/i }))
      expect(mockUpdateAsync).toHaveBeenCalledWith({
        data: {
          [`tripMembers.member-uid`]: expect.objectContaining({
            safetyItineraryOptedOut: true,
          }),
        },
      })
    })

    it('toggle is disabled when global opt-out is active', async () => {
      const user = userEvent.setup()
      renderAsMember({}, { preferences: { safetyItineraryEnabled: false } })
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      const checkbox = screen.getByRole('checkbox', { name: /safety itinerary/i })
      expect(checkbox).toBeDisabled()
    })

    it('shows note linking to Settings when global opt-out is active', async () => {
      const user = userEvent.setup()
      renderAsMember({}, { preferences: { safetyItineraryEnabled: false } })
      await user.click(screen.getByRole('button', { name: /trip settings/i }))
      expect(screen.getByText(/globally disabled/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings')
    })
  })
})
