import { describe, expect, it } from 'vitest'

import { calculateProfileCompletion } from './profileCompletion'
import type { User } from '../types/User'

const baseUser: User = {
  uid: 'u1',
  id: 'u1',
  displayName: '',
  email: '',
  username: '',
  profileHeaderImage: '',
}

describe('calculateProfileCompletion', () => {
  it('returns 22 for a new account with only username and email set', () => {
    const user: User = { ...baseUser, username: 'jsmith', email: 'j@example.com' }
    expect(calculateProfileCompletion(user)).toBe(22)
  })

  it('returns 100 for a fully completed profile', () => {
    const user: User = {
      ...baseUser,
      displayName: 'John',
      username: 'john',
      email: 'john@example.com',
      bio: 'Avid hiker',
      location: 'Vancouver, BC',
      photoURL: 'https://example.com/photo.jpg',
      profileHeaderImage: 'https://example.com/header.jpg',
      website: 'https://johnsblog.com',
      emergencyContacts: [{ name: 'Jane', email: 'jane@example.com', phoneNumber: '555-0100' }],
    }
    expect(calculateProfileCompletion(user)).toBe(100)
  })

  it('each individual field increments score by correct amount', () => {
    const fields: Array<Partial<User>> = [
      { displayName: 'John' },
      { username: 'john' },
      { email: 'j@test.com' },
      { bio: 'hello' },
      { location: 'Vancouver' },
      { photoURL: 'https://example.com/photo.jpg' },
      { emergencyContacts: [{ name: 'Jane', email: '', phoneNumber: '' }] },
    ]

    for (const field of fields) {
      const user: User = { ...baseUser, ...field }
      const score = calculateProfileCompletion(user)
      expect(score).toBe(11)
    }
  })

  it('empty emergencyContacts array does not count as complete', () => {
    const user: User = { ...baseUser, emergencyContacts: [] }
    expect(calculateProfileCompletion(user)).toBe(0)
  })

  it('returns correct percentage when 4 of 9 fields are filled', () => {
    const user: User = {
      ...baseUser,
      displayName: 'John',
      username: 'john',
      email: 'j@test.com',
      bio: 'hello',
    }
    expect(calculateProfileCompletion(user)).toBe(44)
  })
})
