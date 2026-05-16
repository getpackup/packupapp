import { describe, expect, it, vi } from 'vitest'

const mockUpdateDoc = vi.fn()
const mockIncrement = vi.fn((n: number) => ({ __increment: n }))
const mockDoc = vi.fn(() => 'mock-doc-ref')

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  increment: (n: number) => mockIncrement(n),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: { fromDate: vi.fn(() => 'mock-ts') },
}))

vi.mock('../firebase/config', () => ({
  firestoreDb: 'mock-db',
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((opts: any) => ({
    mutateAsync: opts.mutationFn,
    mutate: opts.mutationFn,
  })),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(() => ({
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { useIncrementTagCounts } from './users'

describe('useIncrementTagCounts', () => {
  beforeEach(() => {
    mockUpdateDoc.mockReset()
    mockIncrement.mockReset().mockImplementation((n: number) => ({ __increment: n }))
    mockDoc.mockReset().mockReturnValue('mock-doc-ref')
  })

  it('issues a single updateDoc with one increment(1) per tag key', async () => {
    const { mutateAsync } = useIncrementTagCounts('user-1')
    await mutateAsync({ tags: ['hiking', 'tent'] })

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
      'tagCounts.hiking': { __increment: 1 },
      'tagCounts.tent': { __increment: 1 },
    })
  })

  it('does not call updateDoc when tags array is empty', async () => {
    const { mutateAsync } = useIncrementTagCounts('user-1')
    await mutateAsync({ tags: [] })

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })
})
