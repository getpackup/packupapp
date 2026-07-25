import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timestamp } from 'firebase/firestore'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { formattedDateRange } from '~/lib/date'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

const OWNER_USER: User = {
  uid: 'owner-1',
  id: 'owner-1',
  displayName: 'Owner User',
  username: 'owneruser',
  email: 'owner@test.com',
}

const FUTURE_START = new Date('2026-08-01T00:00:00')
const FUTURE_END = new Date('2026-08-05T00:00:00')

const mockNavigate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockCreateTrip = vi.fn()
const mockGeneratePackingList = vi.fn()
const mockIncrementTagCounts = vi.fn()
const mockSendFriendReq = vi.fn()
const mockTrackBrowserEvent = vi.fn()
const mockUseFriendSearch = vi.fn()
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

vi.mock('~/firebase/config', () => ({
  firebaseAuth: {},
  firestoreDb: {},
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: OWNER_USER })),
}))

vi.mock('~/services/trips', () => ({
  useCreateTrip: vi.fn(() => ({ mutateAsync: mockCreateTrip })),
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: mockGeneratePackingList })),
}))

vi.mock('~/services/users', () => ({
  useIncrementTagCounts: vi.fn(() => ({ mutate: mockIncrementTagCounts })),
  useUserByIdQuery: vi.fn(() => ({ data: undefined })),
}))

vi.mock('~/services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({ data: { customTags: [] } })),
}))

vi.mock('~/services/friends', () => ({
  useFriendUsersQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSendFriendRequest: vi.fn(() => ({ mutateAsync: mockSendFriendReq })),
}))

vi.mock('~/services/useFriendSearch', () => ({
  useFriendSearch: (...args: unknown[]) => mockUseFriendSearch(...args),
}))

vi.mock('~/lib/analytics', async () => {
  const actual = await vi.importActual<typeof import('~/lib/analytics')>('~/lib/analytics')
  return { ...actual, trackBrowserEvent: (...args: unknown[]) => mockTrackBrowserEvent(...args) }
})

vi.mock('~/components/AnimatedContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./DatesStep', () => ({
  default: ({ form }: { form: { setValue: (name: string, value: unknown) => void } }) => (
    <div>
      <h1>When are you going?</h1>
      <button
        type="button"
        onClick={() => {
          form.setValue('startDate', FUTURE_START)
          form.setValue('endDate', FUTURE_END)
        }}
      >
        Choose dates
      </button>
    </div>
  ),
}))

import NewTripForm from './index'

const HEADINGS = {
  location: 'Where are you headed?',
  dates: 'When are you going?',
  members: 'Anyone else coming along?',
  name: 'What do you want to call this adventure?',
  headerImage: 'What image do you want to use for your trip?',
  tags: 'What are you doing on this trip?',
}

function renderWizard() {
  return render(
    <MemoryRouter>
      <NewTripForm />
    </MemoryRouter>
  )
}

type TestUser = ReturnType<typeof userEvent.setup>

async function clickNext(user: TestUser) {
  await user.click(screen.getByRole('button', { name: /^next$/i }))
}

// Steps 0, 1, and 3 have required-field validation, so advancing past them awaits
// react-hook-form's async zod validation before the next heading renders.
async function fillLocationStep(user: TestUser) {
  await user.type(screen.getByLabelText('Location'), 'Banff, AB')
  await clickNext(user)
  await screen.findByText(HEADINGS.dates)
}

async function fillDatesStep(user: TestUser) {
  await user.click(screen.getByRole('button', { name: /choose dates/i }))
  await clickNext(user)
  await screen.findByText(HEADINGS.members)
}

async function advanceToMembersStep(user: TestUser) {
  await fillLocationStep(user)
  await fillDatesStep(user)
}

async function advanceFromMembersStepToTags(user: TestUser) {
  await clickNext(user)
  await screen.findByText(HEADINGS.name)
  await user.type(screen.getByLabelText('Trip Name'), 'Rockies Adventure')
  await clickNext(user)
  await screen.findByText(HEADINGS.headerImage)
  await clickNext(user)
  await screen.findByText(HEADINGS.tags)
}

async function goToStep(user: TestUser, targetStep: number) {
  if (targetStep >= 1) await fillLocationStep(user)
  if (targetStep >= 2) await fillDatesStep(user)
  if (targetStep >= 3) {
    await clickNext(user)
    await screen.findByText(HEADINGS.name)
  }
  if (targetStep >= 4) {
    await user.type(screen.getByLabelText('Trip Name'), 'Rockies Adventure')
    await clickNext(user)
    await screen.findByText(HEADINGS.headerImage)
  }
  if (targetStep >= 5) {
    await clickNext(user)
    await screen.findByText(HEADINGS.tags)
  }
}

async function fillWizardAndSubmit(user: TestUser) {
  await advanceToMembersStep(user)
  await advanceFromMembersStepToTags(user)
  await user.click(screen.getByRole('button', { name: /create trip/i }))
}

function mockInviteeInFriendsSection(email: string, username: string, uid: string) {
  mockUseFriendSearch.mockReturnValue({
    friendHits: [{ uid, id: uid, displayName: username, username, email }],
    allUserHits: [],
    isLoading: false,
  })
}

async function addFromFriendsSection(user: TestUser) {
  await user.click(screen.getByPlaceholderText(/search/i))
  await user.click(screen.getByLabelText('Add to trip'))
}

function findInvitationCalls() {
  return mockFetch.mock.calls.filter((c) => c[0] === '/resource/send-trip-invitation')
}

function findFriendRequestCalls() {
  return mockFetch.mock.calls.filter((c) => c[0] === '/resource/send-friend-request')
}

describe('NewTripForm — stepper navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFriendSearch.mockReturnValue({ friendHits: [], allUserHits: [], isLoading: false })
  })

  it('starts on the location step with Previous disabled', () => {
    renderWizard()
    expect(screen.getByText(HEADINGS.location)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('blocks advancing past the location step without a starting point', async () => {
    const user = userEvent.setup()
    renderWizard()
    await clickNext(user)
    expect(await screen.findByText(/location must be at least 3 characters/i)).toBeInTheDocument()
    expect(screen.getByText(HEADINGS.location)).toBeInTheDocument()
  })

  it('blocks advancing past the dates step without dates', async () => {
    const user = userEvent.setup()
    renderWizard()
    await fillLocationStep(user)
    await clickNext(user)
    await waitFor(() => expect(screen.getByText(HEADINGS.dates)).toBeInTheDocument())
  })

  it('blocks advancing past the name step without a trip name', async () => {
    const user = userEvent.setup()
    renderWizard()
    await goToStep(user, 3)
    expect(screen.getByText(HEADINGS.name)).toBeInTheDocument()
    await clickNext(user)
    expect(await screen.findByText(/name must be at least 3 characters/i)).toBeInTheDocument()
    expect(screen.getByText(HEADINGS.name)).toBeInTheDocument()
  })

  it('walks through every step to the final "Create trip" button', async () => {
    const user = userEvent.setup()
    renderWizard()
    await goToStep(user, 5)
    expect(screen.getByText(HEADINGS.tags)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create trip/i })).toBeInTheDocument()
  })

  it('Previous returns to the prior step', async () => {
    const user = userEvent.setup()
    renderWizard()
    await goToStep(user, 1)
    expect(screen.getByText(HEADINGS.dates)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByText(HEADINGS.location)).toBeInTheDocument()
  })
})

describe('NewTripForm — submission', () => {
  const createdTripId = 'trip-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFriendSearch.mockReturnValue({ friendHits: [], allUserHits: [], isLoading: false })
    mockFetch.mockResolvedValue({ ok: true })
    mockCreateTrip.mockImplementation(async ({ data }: { data: Omit<Trip, 'id' | 'tripId'> }) => ({
      ...data,
      id: createdTripId,
      tripId: createdTripId,
    }))
    mockGeneratePackingList.mockResolvedValue([])
    mockSendFriendReq.mockResolvedValue(undefined)
  })

  it('creates the trip with the owner as Owner and shows a success toast', async () => {
    const user = userEvent.setup()
    renderWizard()
    await fillWizardAndSubmit(user)

    await waitFor(() => expect(mockCreateTrip).toHaveBeenCalledTimes(1))
    const call = mockCreateTrip.mock.calls[0][0]
    expect(call.data.name).toBe('Rockies Adventure')
    expect(call.data.startingPoint).toBe('Banff, AB')
    expect(call.tripMembers[OWNER_USER.uid].status).toBe('Owner')
    expect(mockToastSuccess).toHaveBeenCalledWith('Trip created')
    expect(mockNavigate).toHaveBeenCalledWith(`/trips/${createdTripId}`)
  })

  it('sends a trip invitation email to an invited member who is not marked as a friend', async () => {
    const user = userEvent.setup()
    renderWizard()

    await advanceToMembersStep(user)
    mockInviteeInFriendsSection('alice@test.com', 'alice', 'invitee-1')
    await addFromFriendsSection(user)
    await advanceFromMembersStepToTags(user)
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => expect(mockCreateTrip).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(findInvitationCalls()).toHaveLength(1))

    const body = findInvitationCalls()[0][1]!.body as FormData
    expect(body.get('email')).toBe('alice@test.com')
    expect(body.get('greetingName')).toBe('alice')
    expect(body.get('invitedBy')).toBe('owneruser')
    expect(body.get('tripName')).toBe('Rockies Adventure')
    expect(body.get('isFriend')).toBe('true')
    expect(body.get('when')).toBe(
      formattedDateRange(
        Timestamp.fromDate(FUTURE_START).seconds * 1000,
        Timestamp.fromDate(FUTURE_END).seconds * 1000
      )
    )

    expect(findFriendRequestCalls()).toHaveLength(0)
    expect(mockSendFriendReq).not.toHaveBeenCalled()
  })

  it('sends both a trip invitation and a friend request for a member flagged to be friended, with a single summary toast', async () => {
    const user = userEvent.setup()
    renderWizard()

    await advanceToMembersStep(user)
    mockUseFriendSearch.mockReturnValue({
      friendHits: [],
      allUserHits: [
        {
          uid: 'invitee-2',
          id: 'invitee-2',
          displayName: 'Bob',
          username: 'bob',
          email: 'bob@test.com',
        },
      ],
      isLoading: false,
    })
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.click(searchInput)
    await user.type(searchInput, 'bob')
    await user.click(screen.getByRole('checkbox', { name: /add as friend/i }))
    await user.click(screen.getByLabelText('Add to trip'))
    await advanceFromMembersStepToTags(user)
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => expect(mockSendFriendReq).toHaveBeenCalledTimes(1))
    expect(mockSendFriendReq).toHaveBeenCalledWith({
      senderUid: OWNER_USER.uid,
      recipientUid: 'invitee-2',
    })

    await waitFor(() => expect(findInvitationCalls()).toHaveLength(1))
    expect((findInvitationCalls()[0][1]!.body as FormData).get('isFriend')).toBe('false')

    await waitFor(() => expect(findFriendRequestCalls()).toHaveLength(1))

    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Trip created (friend requests will be sent upon trip creation)'
    )
    expect(
      mockToastSuccess.mock.calls.filter(
        (c) => c[0] === 'Trip created (friend requests will be sent upon trip creation)'
      )
    ).toHaveLength(1)
  })

  it('sends one invitation email per invited member and none for the owner', async () => {
    const user = userEvent.setup()
    renderWizard()

    await advanceToMembersStep(user)
    mockUseFriendSearch.mockReturnValue({
      friendHits: [
        {
          uid: 'invitee-1',
          id: 'invitee-1',
          displayName: 'Alice',
          username: 'alice',
          email: 'alice@test.com',
        },
        {
          uid: 'invitee-2',
          id: 'invitee-2',
          displayName: 'Bob',
          username: 'bob',
          email: 'bob@test.com',
        },
      ],
      allUserHits: [],
      isLoading: false,
    })
    await user.click(screen.getByPlaceholderText(/search/i))
    await user.click(screen.getAllByLabelText('Add to trip')[0])
    await user.click(screen.getAllByLabelText('Add to trip')[0])
    await advanceFromMembersStepToTags(user)
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => expect(mockCreateTrip).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(findInvitationCalls()).toHaveLength(2))
    const invitedEmails = findInvitationCalls().map((c) => (c[1]!.body as FormData).get('email'))
    expect(invitedEmails.sort()).toEqual(['alice@test.com', 'bob@test.com'])
  })

  it('does not block trip creation when the invitation email fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()
    renderWizard()

    await advanceToMembersStep(user)
    mockInviteeInFriendsSection('alice@test.com', 'alice', 'invitee-1')
    await addFromFriendsSection(user)
    await advanceFromMembersStepToTags(user)
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(`/trips/${createdTripId}`))
  })

  it('generates a packing list when activity tags are selected and shows an item-count toast', async () => {
    mockGeneratePackingList.mockResolvedValue([{ id: 'item-1' }, { id: 'item-2' }])
    const user = userEvent.setup()
    renderWizard()

    await goToStep(user, 5)
    await user.click(screen.getByRole('checkbox', { name: /^hiking$/i }))
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => expect(mockGeneratePackingList).toHaveBeenCalledTimes(1))
    const call = mockGeneratePackingList.mock.calls[0][0]
    expect(call.activityKeys).toContain('hiking')
    expect(mockToastSuccess).toHaveBeenCalledWith('Trip created with 2 packing list items')
  })

  it('does not generate a packing list when no tags are selected', async () => {
    const user = userEvent.setup()
    renderWizard()
    await fillWizardAndSubmit(user)

    await waitFor(() => expect(mockCreateTrip).toHaveBeenCalledTimes(1))
    expect(mockGeneratePackingList).not.toHaveBeenCalled()
    expect(mockToastSuccess).toHaveBeenCalledWith('Trip created')
  })

  it('falls back to a warning toast when packing list generation fails, but still navigates', async () => {
    mockGeneratePackingList.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    renderWizard()

    await goToStep(user, 5)
    await user.click(screen.getByRole('checkbox', { name: /^hiking$/i }))
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Trip created (packing list generation failed — you can retry from the trip page)'
      )
    )
    expect(mockNavigate).toHaveBeenCalledWith(`/trips/${createdTripId}`)
  })

  it('shows an error toast and does not navigate when trip creation fails', async () => {
    mockCreateTrip.mockRejectedValue(new Error('firestore down'))
    const user = userEvent.setup()
    renderWizard()
    await fillWizardAndSubmit(user)

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Failed to create trip'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('tracks TripCreated and TripMemberInvited analytics events', async () => {
    const user = userEvent.setup()
    renderWizard()

    await advanceToMembersStep(user)
    mockInviteeInFriendsSection('alice@test.com', 'alice', 'invitee-1')
    await addFromFriendsSection(user)
    await advanceFromMembersStepToTags(user)
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() =>
      expect(mockTrackBrowserEvent).toHaveBeenCalledWith(
        'trip_created',
        OWNER_USER.uid,
        expect.objectContaining({ trip_id: createdTripId, member_count: 2 })
      )
    )
    expect(mockTrackBrowserEvent).toHaveBeenCalledWith(
      'trip_member_invited',
      OWNER_USER.uid,
      expect.objectContaining({ trip_id: createdTripId, invitee_user_id: 'invitee-1' })
    )
  })
})
