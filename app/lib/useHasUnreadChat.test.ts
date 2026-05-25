import { Timestamp } from 'firebase/firestore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockOnSnapshot, mockDoc, mockUseAuth, mockUseIsAnonymous } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
  mockDoc: vi.fn((..._args: unknown[]) => 'mock-doc-ref'),
  mockUseAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
  })),
  mockUseIsAnonymous: vi.fn(() => false),
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

vi.mock('../contexts/auth/useAuth', () => {
  return { useAuth: mockUseAuth, default: mockUseAuth }
})

vi.mock('./useIsAnonymous', () => ({
  useIsAnonymous: mockUseIsAnonymous,
}))

import { renderHook, act } from '@testing-library/react'
import { useHasUnreadChat } from './useHasUnreadChat'

describe('useHasUnreadChat', () => {
  let metadataCallback: (snap: any) => void
  let readStatusCallback: (snap: any) => void

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { uid: 'u1', username: 'testuser', email: 'test@test.com', isAnonymous: false },
    })
    mockUseIsAnonymous.mockReturnValue(false)

    mockOnSnapshot.mockImplementation((_ref: any, callback: (snap: any) => void) => {
      if (mockOnSnapshot.mock.calls.length % 2 === 1) {
        metadataCallback = callback
      } else {
        readStatusCallback = callback
      }
      return vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when chatMetadata does not exist (no messages)', () => {
    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    act(() => {
      metadataCallback({ exists: () => false, data: () => undefined })
      readStatusCallback({ exists: () => false, data: () => undefined })
    })

    expect(result.current).toBe(false)
  })

  it('returns true when chatMetadata exists but no chatReadStatus doc exists for user', () => {
    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    act(() => {
      metadataCallback({
        exists: () => true,
        data: () => ({ lastMessageAt: Timestamp.fromDate(new Date('2026-01-02')) }),
      })
      readStatusCallback({ exists: () => false, data: () => undefined })
    })

    expect(result.current).toBe(true)
  })

  it('returns true when lastMessageAt > lastReadAt', () => {
    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    act(() => {
      metadataCallback({
        exists: () => true,
        data: () => ({ lastMessageAt: Timestamp.fromDate(new Date('2026-01-02')) }),
      })
      readStatusCallback({
        exists: () => true,
        data: () => ({ lastReadAt: Timestamp.fromDate(new Date('2026-01-01')) }),
      })
    })

    expect(result.current).toBe(true)
  })

  it('returns false when lastReadAt >= lastMessageAt', () => {
    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    act(() => {
      metadataCallback({
        exists: () => true,
        data: () => ({ lastMessageAt: Timestamp.fromDate(new Date('2026-01-01')) }),
      })
      readStatusCallback({
        exists: () => true,
        data: () => ({ lastReadAt: Timestamp.fromDate(new Date('2026-01-02')) }),
      })
    })

    expect(result.current).toBe(false)
  })

  it('returns false for anonymous users', () => {
    mockUseIsAnonymous.mockReturnValue(true)

    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    expect(result.current).toBe(false)
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })

  it('returns false when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null } as any)

    const { result } = renderHook(() => useHasUnreadChat('trip-1'))

    expect(result.current).toBe(false)
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })

  it('subscribes to correct Firestore document paths', () => {
    renderHook(() => useHasUnreadChat('trip-1'))

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'trips', 'trip-1', 'chatMetadata', 'meta')
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'trips', 'trip-1', 'chatReadStatus', 'u1')
  })

  it('cleans up subscriptions on unmount', () => {
    const unsubMeta = vi.fn()
    const unsubRead = vi.fn()
    mockOnSnapshot
      .mockReturnValueOnce(unsubMeta)
      .mockReturnValueOnce(unsubRead)

    const { unmount } = renderHook(() => useHasUnreadChat('trip-1'))

    unmount()

    expect(unsubMeta).toHaveBeenCalled()
    expect(unsubRead).toHaveBeenCalled()
  })
})
