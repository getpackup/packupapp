import { Timestamp } from 'firebase/firestore'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDoc = vi.fn()
const mockQuery = vi.fn()
const mockCollection = vi.fn()
const mockWhere = vi.fn()
const mockGetDocs = vi.fn()

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return {
    ...actual,
    getDoc: (...args: any[]) => mockGetDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    doc: (...args: any[]) => mockDoc(...args),
    query: (...args: any[]) => mockQuery(...args),
    collection: (...args: any[]) => mockCollection(...args),
    where: (...args: any[]) => mockWhere(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
  }
})

vi.mock('../firebase/config', () => ({
  firestoreDb: {},
}))

import { buildFriendshipId } from '../types/Friendship'
import {
  fetchAllFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
} from './friends'

describe('buildFriendshipId', () => {
  it('sorts UIDs alphabetically and joins with underscore', () => {
    expect(buildFriendshipId('zzzUser', 'aaaUser')).toBe('aaaUser_zzzUser')
  })

  it('produces the same ID regardless of order', () => {
    expect(buildFriendshipId('uid1', 'uid2')).toBe(buildFriendshipId('uid2', 'uid1'))
  })
})

describe('friends service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.mockReturnValue('mock-doc-ref')
    mockCollection.mockReturnValue('mock-collection-ref')
    mockQuery.mockReturnValue('mock-query-ref')
    mockWhere.mockReturnValue('mock-where-constraint')
  })

  describe('sendFriendRequest', () => {
    it('creates a pending friendship document with correct fields', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false })
      mockSetDoc.mockResolvedValue(undefined)

      await sendFriendRequest('senderUid', 'recipientUid')

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          uids: expect.arrayContaining(['senderUid', 'recipientUid']),
          requesterUid: 'senderUid',
          status: 'pending',
        })
      )
    })

    it('rejects if a request was declined within 30 days', async () => {
      const recentDecline = Timestamp.fromDate(new Date())
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          status: 'declined',
          declinedAt: recentDecline,
        }),
      })

      await expect(sendFriendRequest('senderUid', 'recipientUid')).rejects.toThrow(
        '30-day cooldown'
      )
      expect(mockSetDoc).not.toHaveBeenCalled()
    })

    it('allows re-send after 30 days of decline', async () => {
      const oldDecline = Timestamp.fromDate(new Date(Date.now() - 31 * 24 * 60 * 60 * 1000))
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          status: 'declined',
          declinedAt: oldDecline,
        }),
      })
      mockSetDoc.mockResolvedValue(undefined)

      await sendFriendRequest('senderUid', 'recipientUid')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('rejects if friendship already exists and is pending', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'pending' }),
      })

      await expect(sendFriendRequest('senderUid', 'recipientUid')).rejects.toThrow(
        'already pending'
      )
    })

    it('rejects if friendship already exists and is accepted', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'accepted' }),
      })

      await expect(sendFriendRequest('senderUid', 'recipientUid')).rejects.toThrow(
        'already friends'
      )
    })
  })

  describe('acceptFriendRequest', () => {
    it('updates status to accepted and sets respondedAt', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      await acceptFriendRequest('uid1_uid2')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          status: 'accepted',
          respondedAt: expect.any(Timestamp),
        })
      )
    })
  })

  describe('declineFriendRequest', () => {
    it('updates status to declined and sets declinedAt', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      await declineFriendRequest('uid1_uid2')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          status: 'declined',
          declinedAt: expect.any(Timestamp),
          respondedAt: expect.any(Timestamp),
        })
      )
    })
  })

  describe('unfriend', () => {
    it('deletes the friendship document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined)

      await unfriend('uid1_uid2')

      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref')
    })
  })

  describe('fetchAllFriendships', () => {
    it('returns all friendships for a user without status filtering', async () => {
      const friendships = [
        {
          id: 'uid1_uid2',
          uids: ['uid1', 'uid2'],
          requesterUid: 'uid1',
          status: 'accepted',
          requestedAt: Timestamp.fromDate(new Date()),
        },
        {
          id: 'uid1_uid3',
          uids: ['uid1', 'uid3'],
          requesterUid: 'uid3',
          status: 'pending',
          requestedAt: Timestamp.fromDate(new Date()),
        },
        {
          id: 'uid1_uid4',
          uids: ['uid1', 'uid4'],
          requesterUid: 'uid4',
          status: 'declined',
          requestedAt: Timestamp.fromDate(new Date()),
          declinedAt: Timestamp.fromDate(new Date()),
        },
      ]
      mockGetDocs.mockResolvedValue({
        docs: friendships.map((f) => ({ id: f.id, data: () => f })),
      })

      const result = await fetchAllFriendships('uid1')

      expect(mockWhere).toHaveBeenCalledWith('uids', 'array-contains', 'uid1')
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(3)
    })
  })
})
