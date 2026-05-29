import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/firebase/config', () => ({
  firebaseAuth: {},
  firestoreDb: {},
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'user-1', isAnonymous: false } })),
  useAuth: vi.fn(() => ({ user: { uid: 'user-1', isAnonymous: false } })),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({ getQueryData: vi.fn(() => undefined) })),
    useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
    useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), mutate: vi.fn() })),
  }
})

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'trip-1' })),
  }
})

vi.mock('~/contexts/globalState', () => ({
  useSoundsState: vi.fn(() => ({ soundsEnabled: false })),
}))

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

const mockHandleSendToShoppingList = vi.fn()
const mockSetShowAccountGate = vi.fn()

const defaultHookReturn = {
  trip: { tripId: 'trip-1', tripMembers: { 'user-1': { role: 'owner' } } } as any,
  users: [],
  constraints: [],
  togglePacked: vi.fn(),
  handleQuantityChange: vi.fn(),
  handleMoveToOrFromGroupItems: vi.fn(),
  handleToggleAssignee: vi.fn(),
  handleDelete: vi.fn(),
  handleSendToShoppingList: mockHandleSendToShoppingList,
  showAccountGate: false,
  setShowAccountGate: mockSetShowAccountGate,
}

vi.mock('~/services/usePackingListItem', () => ({
  usePackingListItem: vi.fn(() => defaultHookReturn),
}))

import { usePackingListItem } from '~/services/usePackingListItem'
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

function renderItem(hookOverrides = {}) {
  vi.mocked(usePackingListItem).mockReturnValue({ ...defaultHookReturn, ...hookOverrides })
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
  it('calls handleSendToShoppingList when Send to Shopping List is clicked', async () => {
    renderItem()

    const menuButton = screen.getByRole('button', { name: '' })
    await userEvent.click(menuButton)

    const sendItem = await screen.findByText('Send to Shopping List')
    await userEvent.click(sendItem)

    expect(mockHandleSendToShoppingList).toHaveBeenCalled()
  })

  it('shows Account Gate dialog when showAccountGate is true', async () => {
    renderItem({ showAccountGate: true })

    expect(
      await screen.findByText(
        'Create an account to build your shopping list across all your trips.'
      )
    ).toBeInTheDocument()
  })

  it('does not show Account Gate when showAccountGate is false', () => {
    renderItem({ showAccountGate: false })

    expect(
      screen.queryByText('Create an account to build your shopping list across all your trips.')
    ).not.toBeInTheDocument()
  })

  it('Account Gate dialog has "Create account" CTA linking to /signup', async () => {
    renderItem({ showAccountGate: true })

    const link = await screen.findByRole('link', { name: /Create account/i })
    expect(link).toHaveAttribute('href', '/signup')
  })
})
