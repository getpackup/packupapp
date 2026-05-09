import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('../contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'test-uid' } })),
}))

vi.mock('../services/shoppingList', () => ({
  useShoppingListQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock('../services/trips', () => ({
  useTripsQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock('../lib/useCheckboxSounds', () => ({
  useCheckboxSounds: vi.fn(() => ({})),
}))

import { useIsAnonymous } from '../lib/useIsAnonymous'
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
      screen.getByText(
        'Create an account to see everything you need to buy before your trips.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/signup'
    )
  })

  it('does not show shopping list content for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderRoute()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
  })

  it('shows shopping list content for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderRoute()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Past')).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Create an account to see everything you need to buy before your trips.'
      )
    ).not.toBeInTheDocument()
  })
})
