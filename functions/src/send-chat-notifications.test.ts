import { describe, expect, it, vi } from 'vitest'

import { TripMemberStatus } from '../../app/types/TripMember'
import type { Trip } from '../../app/types/Trip'
import type { User } from '../../app/types/User'
import type { ChatNotificationDeps } from './send-chat-notifications'
import { processChatNotification } from './send-chat-notifications'
import { Timestamp } from 'firebase/firestore'

function makeTrip(overrides: Partial<Trip> = {}): Partial<Trip> {
  return {
    tripId: 'trip-1',
    id: 'trip-1',
    name: 'Beach Camping',
    tripMembers: {
      'user-owner': {
        uid: 'user-owner',
        status: TripMemberStatus.Owner,
        invitedAt: Timestamp.now(),
      },
      'user-accepted': {
        uid: 'user-accepted',
        status: TripMemberStatus.Accepted,
        invitedAt: Timestamp.now(),
      },
      'user-pending': {
        uid: 'user-pending',
        status: TripMemberStatus.Pending,
        invitedAt: Timestamp.now(),
      },
    },
    ...overrides,
  }
}

function makeUser(uid: string, overrides: Partial<User> = {}): Partial<User> {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: uid,
    fcmTokens: [`token-${uid}`],
    ...overrides,
  }
}

function makeDeps(
  trip: Partial<Trip> | null = makeTrip(),
  users: Map<string, Partial<User>> = new Map()
): { deps: ChatNotificationDeps; sendNotifications: ReturnType<typeof vi.fn>; removeTokens: ReturnType<typeof vi.fn> } {
  const sendNotifications = vi.fn().mockResolvedValue([])
  const removeTokens = vi.fn().mockResolvedValue(undefined)
  return {
    deps: {
      getTrip: vi.fn().mockResolvedValue(trip),
      getUsersByUids: vi.fn().mockResolvedValue(users),
      sendNotifications,
      removeTokens,
    },
    sendNotifications,
    removeTokens,
  }
}

function makeMessage(overrides: Partial<{ userId: string; userName: string; type: string }> = {}) {
  return {
    userId: 'sender-uid',
    userName: 'Alice',
    type: 'text',
    ...overrides,
  }
}

describe('processChatNotification', () => {
  it('sends notification to eligible trip members excluding sender', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        recipient: { uid: 'recipient', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['recipient', makeUser('recipient')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender', userName: 'Alice' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).toHaveBeenCalledOnce()
    expect(sendNotifications).toHaveBeenCalledWith(
      ['token-recipient'],
      { notification: { title: 'Alice sent a message in Beach Camping' }, data: { tripId: 'trip-1', url: '/trips/trip-1?chat=open' } }
    )
  })

  it('does not send notification for system messages', async () => {
    const users = new Map([
      ['user-owner', makeUser('user-owner')],
      ['user-accepted', makeUser('user-accepted')],
    ])
    const { deps, sendNotifications } = makeDeps(makeTrip(), users)

    await processChatNotification(
      makeMessage({ type: 'system' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('excludes sender from notification recipients', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        other: { uid: 'other', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['other', makeUser('other')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    const calledTokens = sendNotifications.mock.calls[0][0]
    expect(calledTokens).not.toContain('token-sender')
    expect(calledTokens).toContain('token-other')
  })

  it('excludes members with chatNotificationsEnabled: false', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        'opted-out': { uid: 'opted-out', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
        'opted-in': { uid: 'opted-in', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['opted-out', makeUser('opted-out', { preferences: { chatNotificationsEnabled: false } })],
      ['opted-in', makeUser('opted-in')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    const calledTokens = sendNotifications.mock.calls[0][0]
    expect(calledTokens).not.toContain('token-opted-out')
    expect(calledTokens).toContain('token-opted-in')
  })

  it('excludes members with Declined status', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        declined: { uid: 'declined', status: TripMemberStatus.Declined, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['declined', makeUser('declined')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('excludes members with Left status', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        left: { uid: 'left', status: TripMemberStatus.Left, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['left', makeUser('left')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('excludes members with Removed status', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        removed: { uid: 'removed', status: TripMemberStatus.Removed, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['removed', makeUser('removed')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('removes stale tokens rejected by FCM', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        recipient: { uid: 'recipient', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['recipient', makeUser('recipient', { fcmTokens: ['good-token', 'stale-token'] })],
    ])
    const { deps, sendNotifications, removeTokens } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([
      { success: true },
      { success: false, error: { code: 'messaging/registration-token-not-registered' } },
    ])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(removeTokens).toHaveBeenCalledWith('recipient', ['stale-token'])
  })

  it('does not call removeTokens when no stale tokens exist', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        recipient: { uid: 'recipient', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['recipient', makeUser('recipient')],
    ])
    const { deps, sendNotifications, removeTokens } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(removeTokens).not.toHaveBeenCalled()
  })

  it('does not send when trip has no eligible members besides sender', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
      },
    })
    const { deps, sendNotifications } = makeDeps(trip)

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('does not send when trip is not found', async () => {
    const { deps, sendNotifications } = makeDeps(null)

    await processChatNotification(makeMessage(), 'trip-1', deps)

    expect(sendNotifications).not.toHaveBeenCalled()
  })

  it('skips members with no fcmTokens', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        'no-tokens': { uid: 'no-tokens', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
        'has-tokens': { uid: 'has-tokens', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['no-tokens', makeUser('no-tokens', { fcmTokens: [] })],
      ['has-tokens', makeUser('has-tokens')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    const calledTokens = sendNotifications.mock.calls[0][0]
    expect(calledTokens).toEqual(['token-has-tokens'])
  })

  it('includes Pending members in notification recipients', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        pending: { uid: 'pending', status: TripMemberStatus.Pending, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['pending', makeUser('pending')],
    ])
    const { deps, sendNotifications } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([{ success: true }])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    const calledTokens = sendNotifications.mock.calls[0][0]
    expect(calledTokens).toContain('token-pending')
  })

  it('removes stale tokens from multiple users correctly', async () => {
    const trip = makeTrip({
      tripMembers: {
        sender: { uid: 'sender', status: TripMemberStatus.Owner, invitedAt: Timestamp.now() },
        alice: { uid: 'alice', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
        bob: { uid: 'bob', status: TripMemberStatus.Accepted, invitedAt: Timestamp.now() },
      },
    })
    const users = new Map([
      ['alice', makeUser('alice', { fcmTokens: ['alice-stale'] })],
      ['bob', makeUser('bob', { fcmTokens: ['bob-stale'] })],
    ])
    const { deps, sendNotifications, removeTokens } = makeDeps(trip, users)
    sendNotifications.mockResolvedValue([
      { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      { success: false, error: { code: 'messaging/registration-token-not-registered' } },
    ])

    await processChatNotification(
      makeMessage({ userId: 'sender' }),
      'trip-1',
      deps
    )

    expect(removeTokens).toHaveBeenCalledWith('alice', ['alice-stale'])
    expect(removeTokens).toHaveBeenCalledWith('bob', ['bob-stale'])
  })
})
