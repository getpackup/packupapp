import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockDoc = vi.fn((...args: any[]) => ({ id: 'mock-doc-ref' }))
const mockCollection = vi.fn((...args: any[]) => `mock-collection:${args.slice(1).join('/')}`)
const mockWriteBatch = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  collection: (...args: any[]) => mockCollection(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
  Timestamp: { now: () => 'mock-now' },
}))

vi.mock('~/firebase/config', () => ({
  firestoreDb: 'mock-db',
}))

const mockAssemblePackingListItems = vi.fn()

vi.mock('~/lib/packingList', () => ({
  assemblePackingListItems: (...args: any[]) => mockAssemblePackingListItems(...args),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}))

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useGeneratePackingList, useTripByIdQuery } from './trips'

function docSnap(data: Record<string, unknown>) {
  return { exists: () => true, id: 'trip-1', data: () => data }
}

function docsSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }
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

describe('useGeneratePackingList', () => {
  beforeEach(() => {
    mockGetDoc.mockReset()
    mockGetDocs.mockReset()
    mockAssemblePackingListItems.mockReset()
    vi.mocked(useMutation).mockReset()
    vi.mocked(useQueryClient).mockReturnValue({
      cancelQueries: vi.fn(),
      invalidateQueries: vi.fn(),
    } as any)
    mockWriteBatch.mockReturnValue({ set: vi.fn(), update: vi.fn(), commit: vi.fn() })
    mockAssemblePackingListItems.mockReturnValue({ itemData: [], mergedTags: [], personalTags: [] })
  })

  it('excludes only the acting member\'s own Personal Items from the dedup set, ignoring other members\' Personal Items and Group Items they are assigned to', async () => {
    mockGetDocs
      .mockResolvedValueOnce(docsSnap([])) // master gear
      .mockResolvedValueOnce(docsSnap([])) // custom gear closet additions
      .mockResolvedValueOnce(
        docsSnap([
          // Member A's own Personal Item — must not block Member B's generation
          {
            id: 'doc-a',
            data: { gearItemId: 'gear-1', packedBy: [{ uid: 'userA', quantity: 1, isShared: false }] },
          },
          // Member B's own prior Personal Item — should still dedupe for Member B
          {
            id: 'doc-b',
            data: { gearItemId: 'gear-2', packedBy: [{ uid: 'userB', quantity: 1, isShared: false }] },
          },
          // Group Item Member B is assigned to — must not block Member B's own Personal Item generation
          {
            id: 'doc-c',
            data: {
              gearItemId: 'gear-3',
              packedBy: [
                { uid: 'userB', quantity: 1, isShared: true },
                { uid: 'userC', quantity: 1, isShared: true },
              ],
            },
          },
        ])
      ) // existing packing-list docs
    mockGetDoc
      .mockResolvedValueOnce(docSnap({ removals: [] })) // gear-closet/userB
      .mockResolvedValueOnce(docSnap({ tags: [] })) // trips/trip-1

    useGeneratePackingList()
    const { mutationFn } = vi.mocked(useMutation).mock.calls[0][0] as any

    await mutationFn({ tripId: 'trip-1', activityKeys: ['hiking'], userId: 'userB', customTagNames: [] })

    expect(mockAssemblePackingListItems).toHaveBeenCalledTimes(1)
    const { existingGearItemIds } = mockAssemblePackingListItems.mock.calls[0][0]
    expect(existingGearItemIds).toEqual(new Set(['gear-2']))
  })
})
