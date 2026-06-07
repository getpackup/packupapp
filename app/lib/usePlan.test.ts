import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockOnSnapshot, mockDoc, mockUseAuth } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
  mockDoc: vi.fn((..._args: unknown[]) => 'mock-doc-ref'),
  mockUseAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  })),
}))

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return {
    ...actual,
    doc: mockDoc,
    onSnapshot: mockOnSnapshot,
  }
})

vi.mock('../firebase/config', () => ({
  firestoreDb: 'mock-db',
}))

vi.mock('../contexts/auth/useAuth', () => ({
  useAuth: mockUseAuth,
  default: mockUseAuth,
}))

import { renderHook, act } from '@testing-library/react'
import { usePlan } from './usePlan'

describe('usePlan', () => {
  let snapshotCallback: (snap: any) => void

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
    })

    mockOnSnapshot.mockImplementation((_ref: any, callback: (snap: any) => void) => {
      snapshotCallback = callback
      return vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns isLoading true before subscription resolves', () => {
    const { result } = renderHook(() => usePlan())

    expect(result.current.isLoading).toBe(true)
  })

  it('returns free plan state when plan field is "free"', () => {
    const { result } = renderHook(() => usePlan())

    act(() => {
      snapshotCallback({ exists: () => true, data: () => ({ plan: 'free' }) })
    })

    expect(result.current.plan).toBe('free')
    expect(result.current.isFree).toBe(true)
    expect(result.current.isPro).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns pro plan state when plan field is "pro"', () => {
    const { result } = renderHook(() => usePlan())

    act(() => {
      snapshotCallback({ exists: () => true, data: () => ({ plan: 'pro' }) })
    })

    expect(result.current.plan).toBe('pro')
    expect(result.current.isPro).toBe(true)
    expect(result.current.isFree).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns isFree true when plan field is absent from document', () => {
    const { result } = renderHook(() => usePlan())

    act(() => {
      snapshotCallback({ exists: () => true, data: () => ({}) })
    })

    expect(result.current.plan).toBe('free')
    expect(result.current.isFree).toBe(true)
    expect(result.current.isPro).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns isFree true and isLoading false when user document does not exist', () => {
    const { result } = renderHook(() => usePlan())

    act(() => {
      snapshotCallback({ exists: () => false, data: () => undefined })
    })

    expect(result.current.plan).toBe('free')
    expect(result.current.isFree).toBe(true)
    expect(result.current.isPro).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns isFree true and isLoading false when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ user: null } as any)

    const { result } = renderHook(() => usePlan())

    expect(result.current.plan).toBe('free')
    expect(result.current.isFree).toBe(true)
    expect(result.current.isPro).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })

  it('subscribes to the correct Firestore document path', () => {
    renderHook(() => usePlan())

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1')
  })

  it('cleans up subscription on unmount', () => {
    const unsub = vi.fn()
    mockOnSnapshot.mockReturnValueOnce(unsub)

    const { unmount } = renderHook(() => usePlan())

    unmount()

    expect(unsub).toHaveBeenCalled()
  })
})
