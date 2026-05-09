import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('../../services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({ data: { customTags: [] } })),
  useCreateCustomTag: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateCustomTag: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteCustomTag: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

import { useIsAnonymous } from '../../lib/useIsAnonymous'
import ManageCustomTagsDialog from './ManageCustomTagsDialog'

const GATE_MESSAGE = 'Create an account to add custom categories to your gear closet.'

function renderComponent() {
  return render(
    <MemoryRouter>
      <ManageCustomTagsDialog userId="u1">
        <button>Custom Tags</button>
      </ManageCustomTagsDialog>
    </MemoryRouter>
  )
}

describe('ManageCustomTagsDialog', () => {
  it('shows the trigger button for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    expect(screen.getByRole('button', { name: /custom tags/i })).toBeInTheDocument()
  })

  it('opens Account Gate modal when anonymous user clicks the button', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /custom tags/i }))
    expect(screen.getByText(GATE_MESSAGE)).toBeInTheDocument()
  })

  it('shows "Create account" CTA linking to /signup in the gate modal', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /custom tags/i }))
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/signup')
  })

  it('opens the full custom tags dialog for registered users', async () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderComponent()
    await userEvent.click(screen.getByRole('button', { name: /custom tags/i }))
    expect(screen.getByText('Custom tags')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('New tag name...')).toBeInTheDocument()
  })
})
