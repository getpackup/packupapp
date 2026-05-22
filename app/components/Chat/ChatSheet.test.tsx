import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

Element.prototype.scrollTo = vi.fn()

vi.mock('../../contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({
    user: { uid: 'u1', username: 'alice', photoURL: null },
    setUser: vi.fn(),
  })),
}))

vi.mock('../../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

vi.mock('../../services/trips', () => ({
  useTripChatMessagesQuery: vi.fn(() => ({ data: [] })),
  useTripChatReadStatusQuery: vi.fn(() => ({ data: [] })),
  useCreateChatMessage: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateTypingStatus: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('../../lib/chat', () => ({
  createChatMessage: vi.fn(),
}))

import type { Trip } from '../../types/Trip'
import { TripMemberStatus } from '../../types/TripMember'
import type { User } from '../../types/User'
import ChatSheet from './ChatSheet'

const ts = Timestamp.fromDate(new Date('2026-06-01'))

const trip: Trip = {
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
  },
}

const users: User[] = [
  { id: 'u1', uid: 'u1', username: 'alice', displayName: 'Alice', email: 'a@test.com' },
]

function renderSheet(defaultOpen?: boolean) {
  return render(
    <MemoryRouter>
      <ChatSheet trip={trip} users={users} defaultOpen={defaultOpen} />
    </MemoryRouter>
  )
}

describe('ChatSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is closed by default when defaultOpen is not provided', () => {
    renderSheet()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens automatically when defaultOpen is true', () => {
    renderSheet(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /trip chat/i })).toBeInTheDocument()
  })

  it('can be opened via the trigger button when defaultOpen is false', async () => {
    const user = userEvent.setup()
    renderSheet(false)

    await user.click(screen.getByRole('button', { name: /trip chat/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
