import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetDoc = vi.fn()
const mockDoc = vi.fn((...args: any[]) => 'mock-doc-ref')

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
}))

vi.mock('~/firebase/config', () => ({
  firestoreDb: 'mock-db',
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}))

import { useQuery } from '@tanstack/react-query'

import { useTripByIdQuery } from './trips'

function docSnap(data: Record<string, unknown>) {
  return { exists: () => true, id: 'trip-1', data: () => data }
}

describe('useTripByIdQuery', () => {
  beforeEach(() => {
    mockGetDoc.mockReset()
    vi.mocked(useQuery).mockReset()
  })

  it('defaults tripMembers to {} when the Firestore doc is missing the field', async () => {
    mockGetDoc.mockResolvedValue(docSnap({ name: 'Test Trip' }))

    useTripByIdQuery({ tripId: 'trip-1' })
    const { queryFn } = vi.mocked(useQuery).mock.calls[0][0] as any

    const trip = await queryFn()

    expect(trip.tripMembers).toEqual({})
  })

  it('defaults tripMembers to {} when the field is null', async () => {
    mockGetDoc.mockResolvedValue(docSnap({ name: 'Test Trip', tripMembers: null }))

    useTripByIdQuery({ tripId: 'trip-1' })
    const { queryFn } = vi.mocked(useQuery).mock.calls[0][0] as any

    const trip = await queryFn()

    expect(trip.tripMembers).toEqual({})
  })

  it('preserves tripMembers when present', async () => {
    const tripMembers = { u1: { uid: 'u1', status: 'owner' } }
    mockGetDoc.mockResolvedValue(docSnap({ name: 'Test Trip', tripMembers }))

    useTripByIdQuery({ tripId: 'trip-1' })
    const { queryFn } = vi.mocked(useQuery).mock.calls[0][0] as any

    const trip = await queryFn()

    expect(trip.tripMembers).toEqual(tripMembers)
  })
})
