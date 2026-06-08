import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import PackingListToolbar from './PackingListToolbar'

const defaultProps = {
  packedPercent: 50,
  filterValue: 'All' as const,
  onFilterChange: vi.fn(),
  searchValue: '',
  onSearchChange: vi.fn(),
  tags: [],
  selectedTags: [],
  onTagToggle: vi.fn(),
  onClearFilters: vi.fn(),
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

  it('filters panel is hidden by default', () => {
    render(<PackingListToolbar {...defaultProps} />)
    expect(screen.queryByPlaceholderText('Search items...')).not.toBeInTheDocument()
  })

  it('filters panel becomes visible after Filters button is clicked', async () => {
    render(<PackingListToolbar {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument()
  })

  it('filters panel collapses when Filters button is clicked again', async () => {
    render(<PackingListToolbar {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.queryByPlaceholderText('Search items...')).not.toBeInTheDocument()
  })

  it('Filters button shows no badge when no filters are active', () => {
    render(<PackingListToolbar {...defaultProps} searchValue="" selectedTags={[]} />)
    expect(screen.queryByTestId('filter-count-badge')).not.toBeInTheDocument()
  })

  it('Filters button shows count badge of 1 when search has a value', () => {
    render(<PackingListToolbar {...defaultProps} searchValue="tent" selectedTags={[]} />)
    const badge = screen.getByTestId('filter-count-badge')
    expect(badge).toHaveTextContent('1')
  })

  it('Filters button shows count badge equal to number of selected tags', () => {
    render(<PackingListToolbar {...defaultProps} searchValue="" selectedTags={['Shelter', 'Cooking']} />)
    const badge = screen.getByTestId('filter-count-badge')
    expect(badge).toHaveTextContent('2')
  })

  it('Filters button shows combined count for search + selected tags', () => {
    render(<PackingListToolbar {...defaultProps} searchValue="tent" selectedTags={['Shelter', 'Cooking']} />)
    const badge = screen.getByTestId('filter-count-badge')
    expect(badge).toHaveTextContent('3')
  })

  it('Clear button is absent inside panel when no filters are active', async () => {
    render(<PackingListToolbar {...defaultProps} searchValue="" selectedTags={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })

  it('Clear button is present inside panel when filters are active', async () => {
    render(<PackingListToolbar {...defaultProps} searchValue="tent" selectedTags={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('Clear button fires onClearFilters callback when clicked', async () => {
    const onClearFilters = vi.fn()
    render(
      <PackingListToolbar
        {...defaultProps}
        searchValue="tent"
        selectedTags={[]}
        onClearFilters={onClearFilters}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it('tag pills are rendered inside the panel when tags are provided', async () => {
    const tags = [
      { tag: 'Shelter', count: 3 },
      { tag: 'Cooking', count: 2 },
    ]
    render(<PackingListToolbar {...defaultProps} tags={tags} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByText('Shelter')).toBeInTheDocument()
    expect(screen.getByText('Cooking')).toBeInTheDocument()
  })

  it('calls onTagToggle with the correct tag when a tag pill is clicked', async () => {
    const onTagToggle = vi.fn()
    const tags = [{ tag: 'Shelter', count: 3 }]
    render(<PackingListToolbar {...defaultProps} tags={tags} onTagToggle={onTagToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    await userEvent.click(screen.getByText('Shelter'))
    expect(onTagToggle).toHaveBeenCalledWith('Shelter')
  })

  it('calls onSearchChange when typing in the search input', async () => {
    const onSearchChange = vi.fn()
    render(<PackingListToolbar {...defaultProps} onSearchChange={onSearchChange} />)
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    await userEvent.type(screen.getByPlaceholderText('Search items...'), 'tent')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('ToggleGroup renders before Add Gear button in the toolbar row', () => {
    render(
      <PackingListToolbar
        {...defaultProps}
        showAddGear
        onAddFromGearClosetClick={vi.fn()}
        onAddItemClick={vi.fn()}
      />
    )
    const addGearButton = screen.getByRole('button', { name: /add gear/i })
    const allToggle = screen.getByLabelText('Toggle all')
    const addGearFollowsToggle =
      allToggle.compareDocumentPosition(addGearButton) & Node.DOCUMENT_POSITION_FOLLOWING
    expect(addGearFollowsToggle).toBeTruthy()
  })
})
