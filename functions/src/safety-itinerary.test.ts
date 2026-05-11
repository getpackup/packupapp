import { describe, expect, it, vi } from 'vitest'

import type { Dependencies, EmailPayload, TripDoc, UserDoc } from './safety-itinerary'
import { processSafetyItineraries } from './safety-itinerary'

function makeTimestamp(date: Date) {
  return { toDate: () => date } as any
}

function makeTripStartingTomorrow(overrides: Partial<TripDoc> = {}): TripDoc {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(8, 0, 0, 0)
  const endDate = new Date(tomorrow)
  endDate.setUTCDate(endDate.getUTCDate() + 3)

  return {
    tripId: 'trip-1',
    name: 'Mt. Robson Backpacking',
    startingPoint: 'Berg Lake Trailhead, BC',
    startDate: makeTimestamp(tomorrow),
    endDate: makeTimestamp(endDate),
    description: 'Three-night trip',
    tripMembers: {
      'user-owner': { uid: 'user-owner', status: 'Owner' },
      'user-accepted': { uid: 'user-accepted', status: 'Accepted' },
      'user-pending': { uid: 'user-pending', status: 'Pending' },
    },
    ...overrides,
  }
}

function makeUser(uid: string, overrides: Partial<UserDoc> = {}): UserDoc {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: uid,
    emergencyContacts: [{ name: 'Contact', phoneNumber: '555-0100', email: 'c@test.com' }],
    ...overrides,
  }
}

function makeDeps(
  trips: TripDoc[] = [],
  users: Map<string, UserDoc> = new Map()
): { deps: Dependencies; sendEmail: ReturnType<typeof vi.fn> } {
  const sendEmail = vi.fn<(payload: EmailPayload) => Promise<void>>().mockResolvedValue(undefined)
  return {
    deps: {
      getTripsStartingTomorrow: vi.fn().mockResolvedValue(trips),
      getUsersByUids: vi.fn().mockResolvedValue(users),
      sendEmail,
    },
    sendEmail,
  }
}

describe('processSafetyItineraries', () => {
  it('does not send emails for members with Declined status', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-declined': { uid: 'user-declined', status: 'Declined' },
        'user-owner': { uid: 'user-owner', status: 'Owner' },
      },
    })
    const users = new Map([
      ['user-declined', makeUser('user-declined')],
      ['user-owner', makeUser('user-owner')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).not.toContain('user-declined')
  })

  it('does not send emails for members with Removed status', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-removed': { uid: 'user-removed', status: 'Removed' },
        'user-owner': { uid: 'user-owner', status: 'Owner' },
      },
    })
    const users = new Map([
      ['user-removed', makeUser('user-removed')],
      ['user-owner', makeUser('user-owner')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).not.toContain('user-removed')
  })

  it('does not send emails for members with Left status', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-left': { uid: 'user-left', status: 'Left' },
        'user-owner': { uid: 'user-owner', status: 'Owner' },
      },
    })
    const users = new Map([
      ['user-left', makeUser('user-left')],
      ['user-owner', makeUser('user-owner')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).not.toContain('user-left')
  })

  it('skips members with safetyItineraryOptedOut set to true', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-opted-out': { uid: 'user-opted-out', status: 'Accepted', safetyItineraryOptedOut: true },
        'user-owner': { uid: 'user-owner', status: 'Owner' },
      },
    })
    const users = new Map([
      ['user-opted-out', makeUser('user-opted-out')],
      ['user-owner', makeUser('user-owner')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).not.toContain('user-opted-out')
    expect(recipients).toContain('user-owner')
  })

  it('skips members whose global safetyItineraryEnabled is false', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-global-out': { uid: 'user-global-out', status: 'Accepted' },
        'user-owner': { uid: 'user-owner', status: 'Owner' },
      },
    })
    const users = new Map([
      ['user-global-out', makeUser('user-global-out', { preferences: { safetyItineraryEnabled: false } })],
      ['user-owner', makeUser('user-owner')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).not.toContain('user-global-out')
    expect(recipients).toContain('user-owner')
  })

  it('sends emails to members with Pending status', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'user-pending': { uid: 'user-pending', status: 'Pending' },
      },
    })
    const users = new Map([['user-pending', makeUser('user-pending')]])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const recipients = sendEmail.mock.calls.map((c) => c[0].recipientUid)
    expect(recipients).toContain('user-pending')
  })

  it('excludes archived trips', async () => {
    const trip = makeTripStartingTomorrow({ archived: true })
    const users = new Map([
      ['user-owner', makeUser('user-owner')],
      ['user-accepted', makeUser('user-accepted')],
      ['user-pending', makeUser('user-pending')],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('includes each recipient their own emergency contacts, not another members', async () => {
    const trip = makeTripStartingTomorrow({
      tripMembers: {
        'alice': { uid: 'alice', status: 'Owner' },
        'bob': { uid: 'bob', status: 'Accepted' },
      },
    })
    const aliceContacts = [{ name: 'Alice Mom', phoneNumber: '555-1111', email: 'amom@test.com' }]
    const bobContacts = [{ name: 'Bob Dad', phoneNumber: '555-2222', email: 'bdad@test.com' }]
    const users = new Map([
      ['alice', makeUser('alice', { emergencyContacts: aliceContacts })],
      ['bob', makeUser('bob', { emergencyContacts: bobContacts })],
    ])
    const { deps, sendEmail } = makeDeps([trip], users)

    await processSafetyItineraries(deps)

    const aliceEmail = sendEmail.mock.calls.find((c) => c[0].recipientUid === 'alice')
    const bobEmail = sendEmail.mock.calls.find((c) => c[0].recipientUid === 'bob')

    expect(aliceEmail![0].emergencyContacts).toEqual(aliceContacts)
    expect(bobEmail![0].emergencyContacts).toEqual(bobContacts)
  })

  it('sends no emails when no trips start tomorrow', async () => {
    const { deps, sendEmail } = makeDeps([], new Map())

    await processSafetyItineraries(deps)

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('returns count of emails sent', async () => {
    const trip = makeTripStartingTomorrow()
    const users = new Map([
      ['user-owner', makeUser('user-owner')],
      ['user-accepted', makeUser('user-accepted')],
      ['user-pending', makeUser('user-pending')],
    ])
    const { deps } = makeDeps([trip], users)

    const count = await processSafetyItineraries(deps)

    expect(count).toBe(3)
  })
})
