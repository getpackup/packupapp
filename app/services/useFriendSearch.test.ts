import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { User } from '../types/User'

const mockSearch = vi.fn()

vi.mock('./algoliaSearch', () => ({
  algoliaSearch: { search: mockSearch },
}))

import { useFriendSearch } from './useFriendSearch'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'uid-1',
    id: 'uid-1',
    displayName: 'Test User',
    username: 'testuser',
    email: 'test@test.com',
    ...overrides,
  }
}

function algoliaHit(user: User) {
  return { ...user, objectID: user.uid }
}

async function flushEffects() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

async function advanceDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200)
  })
}

describe('useFriendSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSearch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns all friends and empty allUserHits when query is empty', async () => {
    const friends = [
      makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice' }),
      makeUser({ uid: 'f2', id: 'f2', displayName: 'Bob' }),
    ]

    const { result } = renderHook(() =>
      useFriendSearch({ query: '', friends, currentUserUid: 'me' })
    )

    expect(result.current.friendHits).toEqual(friends)
    expect(result.current.allUserHits).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('filters friendHits locally for 1-char query without calling Algolia', async () => {
    const friends = [
      makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice', email: 'alice@test.com' }),
      makeUser({ uid: 'f2', id: 'f2', displayName: 'Bob', username: 'bob', email: 'bob@test.com' }),
    ]

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'a', friends, currentUserUid: 'me' })
    )

    expect(result.current.friendHits).toEqual([friends[0]])
    expect(result.current.allUserHits).toEqual([])
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('fires Algolia after 2+ chars (debounced) and returns results in allUserHits', async () => {
    const friends = [
      makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice', username: 'alice' }),
    ]

    const algoliaUser = makeUser({
      uid: 'u1',
      id: 'u1',
      displayName: 'Alicia',
      username: 'alicia',
    })
    mockSearch.mockResolvedValue({
      results: [{ hits: [algoliaHit(algoliaUser)] }],
    })

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'al', friends, currentUserUid: 'me' })
    )

    await flushEffects()
    expect(result.current.isLoading).toBe(true)

    await advanceDebounce()
    await flushEffects()

    expect(result.current.isLoading).toBe(false)
    expect(mockSearch).toHaveBeenCalledWith([{ indexName: 'Users', query: 'al' }])
    expect(result.current.friendHits).toEqual([friends[0]])
    expect(result.current.allUserHits).toEqual([algoliaHit(algoliaUser)])
  })

  it('deduplicates allUserHits against friendHits', async () => {
    const friends = [makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice' })]

    mockSearch.mockResolvedValue({
      results: [
        {
          hits: [
            algoliaHit(makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice' })),
            algoliaHit(makeUser({ uid: 'u1', id: 'u1', displayName: 'Stranger' })),
          ],
        },
      ],
    })

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'al', friends, currentUserUid: 'me' })
    )

    await flushEffects()
    await advanceDebounce()
    await flushEffects()

    expect(result.current.allUserHits).toHaveLength(1)
    expect(result.current.allUserHits[0].uid).toBe('u1')
  })

  it('excludes current user UID from friendHits', () => {
    const friends = [
      makeUser({ uid: 'me', id: 'me', displayName: 'Me' }),
      makeUser({ uid: 'f1', id: 'f1', displayName: 'Alice' }),
    ]

    const { result } = renderHook(() =>
      useFriendSearch({ query: '', friends, currentUserUid: 'me' })
    )

    expect(result.current.friendHits).toHaveLength(1)
    expect(result.current.friendHits[0].uid).toBe('f1')
  })

  it('excludes current user UID from allUserHits', async () => {
    mockSearch.mockResolvedValue({
      results: [
        {
          hits: [
            algoliaHit(makeUser({ uid: 'me', id: 'me', displayName: 'Me' })),
            algoliaHit(makeUser({ uid: 'u1', id: 'u1', displayName: 'Other' })),
          ],
        },
      ],
    })
    const friends: User[] = []

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'test', friends, currentUserUid: 'me' })
    )

    await flushEffects()
    await advanceDebounce()
    await flushEffects()

    expect(result.current.allUserHits).toHaveLength(1)
    expect(result.current.allUserHits[0].uid).toBe('u1')
  })

  it('sets isLoading true before search resolves and false after', async () => {
    mockSearch.mockResolvedValue({ results: [{ hits: [] }] })
    const friends: User[] = []

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'test', friends, currentUserUid: 'me' })
    )

    await flushEffects()
    expect(result.current.isLoading).toBe(true)

    await advanceDebounce()
    await flushEffects()

    expect(result.current.isLoading).toBe(false)
  })

  it('sets isLoading false when query is shorter than 2 characters', async () => {
    const friends: User[] = []

    const { result } = renderHook(() =>
      useFriendSearch({ query: 'x', friends, currentUserUid: 'me' })
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockSearch).not.toHaveBeenCalled()
  })
})
