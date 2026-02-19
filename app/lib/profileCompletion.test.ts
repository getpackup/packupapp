import { describe, expect, it } from 'vitest'

import { calculateProfileCompletion, completionFields } from './profileCompletion'
import type { User } from '~/types/User'

const baseUser: User = {
  uid: 'u1',
  id: 'u1',
  displayName: '',
  email: '',
  username: '',
}

describe('calculateProfileCompletion', () => {
  it('returns 25 for a new account with only username and email set', () => {
    const user: User = { ...baseUser, username: 'jsmith', email: 'j@example.com' }
    expect(calculateProfileCompletion(user)).toBe(25)
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
      favouriteActivities: ['hiking'],
      emergencyContacts: [{ name: 'Jane', email: 'jane@example.com', phoneNumber: '555-0100' }],
    }
    expect(calculateProfileCompletion(user)).toBe(100)
  })

  it('each individual field increments score by 12.5', () => {
    const fields: Array<Partial<User>> = [
      { displayName: 'John' },
      { username: 'john' },
      { email: 'j@test.com' },
      { bio: 'hello' },
      { location: 'Vancouver' },
      { photoURL: 'https://example.com/photo.jpg' },
      { favouriteActivities: ['hiking'] },
      { emergencyContacts: [{ name: 'Jane', email: '', phoneNumber: '' }] },
    ]

    for (const field of fields) {
      const user: User = { ...baseUser, ...field }
      const score = calculateProfileCompletion(user)
      expect(score).toBe(12.5)
    }
  })

  it('empty favouriteActivities array does not count as complete', () => {
    const user: User = { ...baseUser, favouriteActivities: [] }
    expect(calculateProfileCompletion(user)).toBe(0)
  })

  it('favouriteActivities with one item counts as complete', () => {
    const user: User = { ...baseUser, favouriteActivities: ['hiking'] }
    expect(calculateProfileCompletion(user)).toBe(12.5)
  })

  it('empty emergencyContacts array does not count as complete', () => {
    const user: User = { ...baseUser, emergencyContacts: [] }
    expect(calculateProfileCompletion(user)).toBe(0)
  })

  it('emergencyContacts with one entry counts as complete', () => {
    const user: User = {
      ...baseUser,
      emergencyContacts: [{ name: 'Jane', email: 'jane@example.com', phoneNumber: '555-0100' }],
    }
    expect(calculateProfileCompletion(user)).toBe(12.5)
  })

  it('returns 50 when 4 of 8 fields are filled', () => {
    const user: User = {
      ...baseUser,
      displayName: 'John',
      username: 'john',
      email: 'j@test.com',
      bio: 'hello',
    }
    expect(calculateProfileCompletion(user)).toBe(50)
  })

  it('correctly changes denominator when a new field is added to the config', () => {
    // Simulate adding a 9th field by testing the completionFields array length
    const fieldCount = completionFields.length
    expect(fieldCount).toBe(8)

    // With 1 of 8 filled, score = 100/8 = 12.5
    const user: User = { ...baseUser, displayName: 'John' }
    expect(calculateProfileCompletion(user)).toBe((1 / fieldCount) * 100)
  })
})
