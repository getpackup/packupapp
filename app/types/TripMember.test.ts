import { describe, it, expect } from 'vitest'
import { TripMemberStatus, type TripMember } from './TripMember'
import type { User } from './User'

describe('TripMemberStatus enum', () => {
  it('includes Left status', () => {
    expect(TripMemberStatus.Left).toBe('Left')
  })
})

describe('TripMember type', () => {
  it('accepts safetyItineraryOptedOut as optional boolean', () => {
    const member: TripMember = {
      invitedAt: {} as TripMember['invitedAt'],
      status: TripMemberStatus.Accepted,
      uid: 'user-1',
    }
    expect(member.safetyItineraryOptedOut).toBeUndefined()

    const optedOut: TripMember = {
      ...member,
      safetyItineraryOptedOut: true,
    }
    expect(optedOut.safetyItineraryOptedOut).toBe(true)
  })
})

describe('User.preferences type', () => {
  it('accepts safetyItineraryEnabled as optional boolean', () => {
    const user: User = {
      displayName: 'Test',
      email: 'test@example.com',
      uid: 'u1',
      id: 'u1',
      username: 'testuser',
      preferences: {
        safetyItineraryEnabled: false,
      },
    }
    expect(user.preferences?.safetyItineraryEnabled).toBe(false)

    const defaultUser: User = {
      displayName: 'Test',
      email: 'test@example.com',
      uid: 'u2',
      id: 'u2',
      username: 'testuser2',
      preferences: {},
    }
    expect(defaultUser.preferences?.safetyItineraryEnabled).toBeUndefined()
  })
})
