import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import PackingListToolbar from './PackingListToolbar'

describe('PackingListToolbar', () => {
  it('progress strip indicator moves to the correct position', () => {
    const { container } = render(
      <PackingListToolbar packedPercent={42} filterValue="All" onFilterChange={vi.fn()} />
    )
    const indicator = container.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toHaveStyle({ transform: 'translateX(-58%)' })
  })

  it('shows correct packed percentage label', () => {
    render(
      <PackingListToolbar packedPercent={75} filterValue="All" onFilterChange={vi.fn()} />
    )
    expect(screen.getByText('75% packed')).toBeInTheDocument()
  })

  it('calls onFilterChange with "Packed" when Packed toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(
      <PackingListToolbar packedPercent={50} filterValue="All" onFilterChange={onFilterChange} />
    )
    await userEvent.click(screen.getByLabelText('Toggle packed'))
    expect(onFilterChange).toHaveBeenCalledWith('Packed')
  })

  it('calls onFilterChange with "Unpacked" when Unpacked toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(
      <PackingListToolbar packedPercent={50} filterValue="All" onFilterChange={onFilterChange} />
    )
    await userEvent.click(screen.getByLabelText('Toggle unpacked'))
    expect(onFilterChange).toHaveBeenCalledWith('Unpacked')
  })

  it('calls onFilterChange with "All" when All toggle is clicked', async () => {
    const onFilterChange = vi.fn()
    render(
      <PackingListToolbar packedPercent={50} filterValue="Packed" onFilterChange={onFilterChange} />
    )
    await userEvent.click(screen.getByLabelText('Toggle all'))
    expect(onFilterChange).toHaveBeenCalledWith('All')
  })
})
