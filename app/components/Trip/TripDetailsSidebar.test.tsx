import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakeTs = (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }) as any

vi.mock('~/contexts/auth/useAuth', () => {
  const fn = vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  }))
  return { useAuth: fn, default: fn }
})

vi.mock('~/services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({
    data: {
      customTags: [
        { id: 'ct1', name: 'Work' },
        { id: 'ct2', name: 'Family' },
      ],
    },
  })),
}))

vi.mock('~/lib/useCustomTagColorMap', () => ({
  useCustomTagColorMap: vi.fn(() => new Map()),
}))

vi.mock('~/services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) })),
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue([]) })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('./AddTripMember', () => ({
  AddTripMember: () => null,
}))

vi.mock('./TripWeather', () => ({
  default: () => null,
}))

vi.mock('./TripSettings', () => ({
  TripSettings: () => null,
}))

vi.mock('./EditTripTags', () => ({
  EditTripTags: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./EditTripDates', () => ({
  EditTripDates: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./EditTripName', () => ({
  EditTripName: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./EditTripDescription', () => ({
  EditTripDescription: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./EditTripLocation', () => ({
  EditTripLocation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import TripDetailsSidebar from './TripDetailsSidebar'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

const ts = fakeTs(new Date('2026-06-01'))

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    tripId: 't1',
    name: 'Test Trip',
    description: '',
    startDate: ts,
    endDate: ts,
    lat: 0,
    lng: 0,
    owner: 'u1',
    startingPoint: 'Trailhead',
    tags: [],
    timezoneOffset: 0,
    tripLength: 1,
    season: 'summer',
    tripMembers: {
      u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts },
      u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts },
    },
    ...overrides,
  }
}

function renderSidebar(tripOverrides: Partial<Trip> = {}) {
  return render(
    <MemoryRouter>
      <TripDetailsSidebar trip={makeTrip(tripOverrides)} users={[]} />
    </MemoryRouter>
  )
}

describe('TripDetailsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Other Considerations section', () => {
    it('shows the current user OC personal tags as labels', () => {
      renderSidebar({
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: ['baby'] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts },
        },
      })
      expect(screen.getByText('Baby')).toBeInTheDocument()
    })

    it('does not show OC labels that are only in trip.tags', () => {
      renderSidebar({
        tags: ['Casual'],
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: [] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts },
        },
      })
      expect(screen.queryByText('Casual')).not.toBeInTheDocument()
    })

    it('does not show another member OC personal tags', () => {
      renderSidebar({
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: [] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts, personalTags: ['kids'] },
        },
      })
      expect(screen.queryByText('Kids')).not.toBeInTheDocument()
    })

    it('shows empty state when user has no OC personal tags', () => {
      renderSidebar({
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts },
        },
      })
      expect(screen.getByText(/No Other Considerations tags added/i)).toBeInTheDocument()
    })
  })

  describe('Custom Tags section', () => {
    it('shows the current user custom tags from personalTags', () => {
      renderSidebar({
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: ['Work'] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts },
        },
      })
      expect(screen.getByText('Work')).toBeInTheDocument()
    })

    it('does not show custom tags that are only in trip.tags', () => {
      renderSidebar({
        tags: ['Work'],
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: [] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts },
        },
      })
      expect(screen.queryByText('Work')).not.toBeInTheDocument()
    })

    it('does not show another member custom personalTags', () => {
      renderSidebar({
        tripMembers: {
          u1: { uid: 'u1', status: TripMemberStatus.Owner, invitedAt: ts, personalTags: [] },
          u2: { uid: 'u2', status: TripMemberStatus.Accepted, invitedAt: ts, personalTags: ['Family'] },
        },
      })
      expect(screen.queryByText('Family')).not.toBeInTheDocument()
    })
  })

  describe('Activities section', () => {
    it('still reads activities from trip.tags', () => {
      renderSidebar({ tags: ['Hiking'] })
      expect(screen.getByText('Hiking')).toBeInTheDocument()
    })
  })
})
