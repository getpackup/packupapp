import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'test-uid' } })),
}))

vi.mock('~/services/shoppingList', () => ({
  useShoppingListQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateShoppingListItem: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('~/services/trips', () => ({
  useTripsQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock('~/lib/useCheckboxSounds', () => ({
  useCheckboxSounds: vi.fn(() => ({})),
}))

import { useIsAnonymous } from '~/lib/useIsAnonymous'
import ShoppingList from './shopping-list'

function renderRoute() {
  return render(
    <MemoryRouter>
      <ShoppingList />
    </MemoryRouter>
  )
}

describe('ShoppingList route', () => {
  it('shows Account Gate for anonymous users with correct copy', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderRoute()
    expect(
      screen.getByText('Create an account to see everything you need to buy before your trips.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/signup')
  })

  it('does not show tabs for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderRoute()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
  })

  it('does not show tabs for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
  })

  it('shows empty state for registered users with no unpurchased items', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.getByText('Your shopping list is empty')).toBeInTheDocument()
  })

  it('does not show UpgradeAccountGate for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(
      screen.queryByText('Create an account to see everything you need to buy before your trips.')
    ).not.toBeInTheDocument()
  })

  it('shows Add item button for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })

  it('does not show Add item button for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderRoute()
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument()
  })

  it('shows purchase state toggle group for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.getByRole('radio', { name: /show unpurchased/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /show purchased/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /show all/i })).toBeInTheDocument()
  })

  it('shows sort toggle group for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.getByRole('radio', { name: /sort by trip/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /sort by priority/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /sort by store/i })).toBeInTheDocument()
  })

  it('does not show filter bar for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderRoute()
    expect(screen.queryByRole('radio', { name: /show unpurchased/i })).not.toBeInTheDocument()
  })
})
