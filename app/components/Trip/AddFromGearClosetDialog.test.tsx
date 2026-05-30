import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'user-1' } })),
  default: vi.fn(() => ({ user: { uid: 'user-1' } })),
}))

vi.mock('~/services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({ data: { customTags: [] } })),
}))

vi.mock('~/services/trips', () => ({
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('~/lib/use-screen-size', () => ({
  useScreenSize: vi.fn(() => ({ isMediumBreakpoint: true })),
}))

import AddFromGearClosetDialog from './AddFromGearClosetDialog'

describe('AddFromGearClosetDialog', () => {
  it('renders the trigger child', () => {
    render(
      <AddFromGearClosetDialog tripId="trip-1">
        <button>Open dialog</button>
      </AddFromGearClosetDialog>
    )
    expect(screen.getByRole('button', { name: 'Open dialog' })).toBeInTheDocument()
  })

  it('shows "Add from Gear Closet" as the dialog title when opened', async () => {
    const user = userEvent.setup()
    render(
      <AddFromGearClosetDialog tripId="trip-1">
        <button>Open dialog</button>
      </AddFromGearClosetDialog>
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    expect(screen.getByRole('heading', { name: 'Add from Gear Closet' })).toBeInTheDocument()
  })

  it('does not show old copy "Add gear by tag" or "Generate packing list"', async () => {
    const user = userEvent.setup()
    render(
      <AddFromGearClosetDialog tripId="trip-1">
        <button>Open dialog</button>
      </AddFromGearClosetDialog>
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    expect(screen.queryByText('Add gear by tag')).not.toBeInTheDocument()
    expect(screen.queryByText('Generate packing list')).not.toBeInTheDocument()
  })
})
