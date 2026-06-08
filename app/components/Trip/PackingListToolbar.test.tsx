import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import PackingListToolbar from './PackingListToolbar'

const defaultProps = {
  packedPercent: 50,
  filterValue: 'All' as const,
  onFilterChange: vi.fn(),
}

describe('PackingListToolbar', () => {
  it('progress strip indicator moves to the correct position', () => {
    const { container } = render(<PackingListToolbar {...defaultProps} packedPercent={42} />)
    const indicator = container.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toHaveStyle({ transform: 'translateX(-58%)' })
  })

  it('shows correct packed percentage label', () => {
    render(<PackingListToolbar {...defaultProps} packedPercent={75} />)
    expect(screen.getByText('75% packed')).toBeInTheDocument()
  })

  it('calls onFilterChange with "Packed" when Packed toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(<PackingListToolbar {...defaultProps} onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByLabelText('Toggle packed'))
    expect(onFilterChange).toHaveBeenCalledWith('Packed')
  })

  it('calls onFilterChange with "Unpacked" when Unpacked toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(<PackingListToolbar {...defaultProps} onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByLabelText('Toggle unpacked'))
    expect(onFilterChange).toHaveBeenCalledWith('Unpacked')
  })

  it('calls onFilterChange with "All" when All toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(<PackingListToolbar {...defaultProps} filterValue="Packed" onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByLabelText('Toggle all'))
    expect(onFilterChange).toHaveBeenCalledWith('All')
  })

  it('does not render Add Gear button when showAddGear is false', () => {
    render(<PackingListToolbar {...defaultProps} showAddGear={false} />)
    expect(screen.queryByRole('button', { name: /add gear/i })).not.toBeInTheDocument()
  })

  it('does not render Add Gear button when showAddGear is omitted', () => {
    render(<PackingListToolbar {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /add gear/i })).not.toBeInTheDocument()
  })

  it('renders Add Gear button when showAddGear is true', () => {
    render(
      <PackingListToolbar
        {...defaultProps}
        showAddGear
        onAddFromGearClosetClick={vi.fn()}
        onAddItemClick={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /add gear/i })).toBeInTheDocument()
  })

  it('opens dropdown with both menu items when Add Gear is clicked', async () => {
    render(
      <PackingListToolbar
        {...defaultProps}
        showAddGear
        onAddFromGearClosetClick={vi.fn()}
        onAddItemClick={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /add gear/i }))
    expect(screen.getByText('Add from Gear Closet')).toBeInTheDocument()
    expect(screen.getByText('Add item')).toBeInTheDocument()
  })

  it('calls onAddFromGearClosetClick when "Add from Gear Closet" menu item is clicked', async () => {
    const onAddFromGearClosetClick = vi.fn()
    render(
      <PackingListToolbar
        {...defaultProps}
        showAddGear
        onAddFromGearClosetClick={onAddFromGearClosetClick}
        onAddItemClick={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /add gear/i }))
    await userEvent.click(screen.getByText('Add from Gear Closet'))
    expect(onAddFromGearClosetClick).toHaveBeenCalledOnce()
  })

  it('calls onAddItemClick when "Add item" menu item is clicked', async () => {
    const onAddItemClick = vi.fn()
    render(
      <PackingListToolbar
        {...defaultProps}
        showAddGear
        onAddFromGearClosetClick={vi.fn()}
        onAddItemClick={onAddItemClick}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /add gear/i }))
    await userEvent.click(screen.getByText('Add item'))
    expect(onAddItemClick).toHaveBeenCalledOnce()
  })
})
