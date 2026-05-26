import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/firebase/config', () => ({
  firebaseAuth: {},
  firestoreDb: {},
}))

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'user-1', isAnonymous: false } })),
  useAuth: vi.fn(() => ({ user: { uid: 'user-1', isAnonymous: false } })),
}))

vi.mock('~/contexts/globalState', () => ({
  useSoundsState: vi.fn(() => ({ soundsEnabled: false })),
}))

const mockCreateShoppingListItemAsync = vi.fn()
vi.mock('~/services/shoppingList', () => ({
  useCreateShoppingListItem: vi.fn(() => ({
    mutateAsync: mockCreateShoppingListItemAsync,
  })),
}))

vi.mock('~/services/trips', () => ({
  tripKeys: { byId: (id: string) => ['trip', id], members: (id: string) => ['members', id] },
  useDeletePackingListItem: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdatePackingListItem: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'trip-1' })),
  }
})

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      getQueryData: vi.fn((key: string[]) => {
        if (key[0] === 'trip')
          return { tripId: 'trip-1', tripMembers: { 'user-1': { role: 'owner' } } }
        return []
      }),
    })),
    useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
    useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), mutate: vi.fn() })),
  }
})

vi.mock('react-spring', () => ({
  animated: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  useSpring: () => ({ transform: 'scale(1)' }),
}))

vi.mock('~/lib/useCheckboxSounds', () => ({
  useCheckboxSounds: vi.fn(() => ({ playActive: vi.fn(), playOn: vi.fn(), playOff: vi.fn() })),
}))

import { useIsAnonymous } from '~/lib/useIsAnonymous'
import type { PackingListItem } from '~/types/PackingListItem'

import TripPackingListItem from './TripPackingListItem'

const baseItem: PackingListItem = {
  id: 'item-1',
  name: 'Tent',
  quantity: 1,
  isEssential: false,
  isPacked: false,
  category: 'Shelter',
  weight: undefined,
  weightUnit: undefined,
  packedBy: [{ uid: 'user-1', quantity: 1, isShared: false }],
  tags: [],
  created: { seconds: 0, nanoseconds: 0 } as any,
}

function renderItem() {
  return render(
    <MemoryRouter>
      <TripPackingListItem
        item={baseItem}
        isMultiSelecting={false}
        isSelected={false}
        onItemSelection={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('TripPackingListItem — Shopping List gate', () => {
  it('shows Account Gate dialog when anonymous user clicks Send to Shopping List', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderItem()

    const menuButton = screen.getByRole('button', { name: '' })
    await userEvent.click(menuButton)

    const sendItem = await screen.findByText('Send to Shopping List')
    await userEvent.click(sendItem)

    expect(
      await screen.findByText(
        'Create an account to build your shopping list across all your trips.'
      )
    ).toBeInTheDocument()

    expect(mockCreateShoppingListItemAsync).not.toHaveBeenCalled()
  })

  it('does not show Account Gate for registered users', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderItem()

    const menuButton = screen.getByRole('button', { name: '' })
    await userEvent.click(menuButton)

    const sendItem = await screen.findByText('Send to Shopping List')
    await userEvent.click(sendItem)

    expect(
      screen.queryByText('Create an account to build your shopping list across all your trips.')
    ).not.toBeInTheDocument()

    expect(mockCreateShoppingListItemAsync).toHaveBeenCalled()
  })

  it('Account Gate dialog has "Create account" CTA linking to /signup', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderItem()

    const menuButton = screen.getByRole('button', { name: '' })
    await userEvent.click(menuButton)

    const sendItem = await screen.findByText('Send to Shopping List')
    await userEvent.click(sendItem)

    const link = await screen.findByRole('link', { name: /Create account/i })
    expect(link).toHaveAttribute('href', '/signup')
  })
})
