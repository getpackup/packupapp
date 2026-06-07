import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockUpdatePackingListItemAsync = vi.fn()
const mockDeletePackingListItemAsync = vi.fn()
const mockCreateShoppingListItemAsync = vi.fn()
const mockGetQueryData = vi.fn()

vi.mock('../firebase/config', () => ({
  firebaseAuth: {},
  firestoreDb: {},
}))

vi.mock('../contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'user-1' } })),
  useAuth: vi.fn(() => ({ user: { uid: 'user-1' } })),
}))

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

vi.mock('./trips', () => ({
  useUpdatePackingListItem: vi.fn(() => ({ mutateAsync: mockUpdatePackingListItemAsync })),
  useDeletePackingListItem: vi.fn(() => ({ mutateAsync: mockDeletePackingListItemAsync })),
}))

vi.mock('./shoppingList', () => ({
  useCreateShoppingListItem: vi.fn(() => ({ mutateAsync: mockCreateShoppingListItemAsync })),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({ getQueryData: mockGetQueryData })),
    useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), mutate: vi.fn() })),
  }
})

vi.mock('../lib/analytics', () => ({
  trackBrowserEvent: vi.fn(),
  getPlatform: vi.fn(() => 'web'),
  AnalyticsEvent: {
    PackingListItemPacked: 'packing_list_item_packed',
  },
}))

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return {
    ...actual,
    where: vi.fn((...args: unknown[]) => ({ type: 'where', args })),
    limit: vi.fn((n: number) => ({ type: 'limit', n })),
    Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
  }
})

import { useIsAnonymous } from '../lib/useIsAnonymous'
import type { PackingListItem } from '../types/PackingListItem'
import type { Trip } from '../types/Trip'
import type { User } from '../types/User'

import { usePackingListItem } from './usePackingListItem'

const mockTrip: Trip = {
  id: 'trip-1',
  tripId: 'trip-1',
  name: 'Test Trip',
  description: '',
  endDate: { seconds: 0, nanoseconds: 0 } as any,
  lat: 0,
  lng: 0,
  owner: 'user-1',
  startDate: { seconds: 0, nanoseconds: 0 } as any,
  startingPoint: '',
  tags: [],
  timezoneOffset: 0,
  tripLength: 1,
  tripMembers: { 'user-1': { uid: 'user-1', role: 'owner' } as any },
}

const mockUsers: User[] = [
  { uid: 'user-1', id: 'user-1', displayName: 'Alice', username: 'alice', email: 'a@test.com' },
  { uid: 'user-2', id: 'user-2', displayName: 'Bob', username: 'bob', email: 'b@test.com' },
]

const baseItem: PackingListItem = {
  id: 'item-1',
  name: 'Tent',
  quantity: 2,
  isEssential: false,
  isPacked: false,
  category: 'Shelter',
  packedBy: [{ uid: 'user-1', quantity: 1, isShared: false }],
  tags: [],
  created: { seconds: 0, nanoseconds: 0 } as any,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetQueryData.mockImplementation((key: readonly unknown[]) => {
    if (Array.isArray(key) && key[1] === 'trip-1' && key.length === 2) return mockTrip
    return mockUsers
  })
  vi.mocked(useIsAnonymous).mockReturnValue(false)
})

describe('usePackingListItem — cache reads', () => {
  it('returns trip from query client cache', () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    expect(result.current.trip).toEqual(mockTrip)
  })

  it('returns users from query client cache', () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    expect(result.current.users).toEqual(mockUsers)
  })

  it('returns empty users when cache has no users', () => {
    mockGetQueryData.mockImplementation((key: readonly unknown[]) => {
      if (Array.isArray(key) && key[1] === 'trip-1' && key.length === 2) return mockTrip
      return undefined
    })
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    expect(result.current.users).toEqual([])
  })

  it('builds non-empty constraints when trip has members', () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    expect(result.current.constraints).toHaveLength(2)
  })

  it('builds empty constraints when trip has no members', () => {
    mockGetQueryData.mockImplementation(() => ({
      ...mockTrip,
      tripMembers: {},
    }))
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    expect(result.current.constraints).toHaveLength(0)
  })
})

describe('usePackingListItem — togglePacked', () => {
  it('calls updatePackingListItemAsync toggling isPacked', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.togglePacked())
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', isPacked: true },
    })
  })
})

describe('usePackingListItem — handleQuantityChange', () => {
  it('increments quantity', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleQuantityChange(1))
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', quantity: 3 },
    })
  })

  it('decrements quantity', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleQuantityChange(-1))
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', quantity: 1 },
    })
  })

  it('does not update when result would be below 1', async () => {
    const itemQty1 = { ...baseItem, quantity: 1 }
    const { result } = renderHook(() => usePackingListItem(itemQty1, 'trip-1'))
    await act(async () => result.current.handleQuantityChange(-1))
    expect(mockUpdatePackingListItemAsync).not.toHaveBeenCalled()
  })
})

describe('usePackingListItem — handleMoveToOrFromGroupItems', () => {
  it('moves personal item to group (isShared: false → true)', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleMoveToOrFromGroupItems())
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', packedBy: [{ uid: 'user-1', quantity: 1, isShared: true }] },
    })
  })

  it('moves group item to personal (isShared: true → false)', async () => {
    const sharedItem = { ...baseItem, packedBy: [{ uid: 'user-1', quantity: 1, isShared: true }] }
    const { result } = renderHook(() => usePackingListItem(sharedItem, 'trip-1'))
    await act(async () => result.current.handleMoveToOrFromGroupItems())
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', packedBy: [{ uid: 'user-1', quantity: 1, isShared: false }] },
    })
  })
})

describe('usePackingListItem — handleToggleAssignee', () => {
  it('adds a new assignee', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleToggleAssignee('user-2'))
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: {
        id: 'item-1',
        packedBy: [
          { uid: 'user-1', quantity: 1, isShared: false },
          { uid: 'user-2', quantity: 1, isShared: true },
        ],
      },
    })
  })

  it('removes an existing assignee', async () => {
    const multiItem = {
      ...baseItem,
      packedBy: [
        { uid: 'user-1', quantity: 1, isShared: true },
        { uid: 'user-2', quantity: 1, isShared: true },
      ],
    }
    const { result } = renderHook(() => usePackingListItem(multiItem, 'trip-1'))
    await act(async () => result.current.handleToggleAssignee('user-2'))
    expect(mockUpdatePackingListItemAsync).toHaveBeenCalledWith({
      data: { id: 'item-1', packedBy: [{ uid: 'user-1', quantity: 1, isShared: true }] },
    })
  })

  it('does not remove last assignee', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleToggleAssignee('user-1'))
    expect(mockUpdatePackingListItemAsync).not.toHaveBeenCalled()
  })
})

describe('usePackingListItem — handleDelete', () => {
  it('calls deletePackingListItemAsync with correct args', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleDelete())
    expect(mockDeletePackingListItemAsync).toHaveBeenCalledWith({
      tripId: 'trip-1',
      packingListItemId: 'item-1',
    })
  })
})

describe('usePackingListItem — handleSendToShoppingList', () => {
  it('sets showAccountGate true for anonymous users', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleSendToShoppingList())
    expect(result.current.showAccountGate).toBe(true)
    expect(mockCreateShoppingListItemAsync).not.toHaveBeenCalled()
  })

  it('calls createShoppingListItemAsync for authenticated users', async () => {
    const { result } = renderHook(() => usePackingListItem(baseItem, 'trip-1'))
    await act(async () => result.current.handleSendToShoppingList())
    expect(result.current.showAccountGate).toBe(false)
    expect(mockCreateShoppingListItemAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemName: 'Tent',
          quantity: 2,
          tripId: 'trip-1',
          userId: 'user-1',
          isPurchased: false,
        }),
      })
    )
  })
})

