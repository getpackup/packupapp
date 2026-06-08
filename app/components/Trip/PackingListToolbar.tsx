import { ChevronDown, Filter, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { getTagDotClass, type TagColorKey } from '~/lib/tagColors'
import { cn } from '~/lib/utils'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { Progress } from '../ui/progress'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

export type PackingListFilter = 'All' | 'Packed' | 'Unpacked'

type TagEntry = { tag: string; count: number }

type PackingListToolbarProps = {
  packedPercent: number
  filterValue: PackingListFilter
  onFilterChange: (value: PackingListFilter) => void
  showAddGear?: boolean
  onAddFromGearClosetClick?: () => void
  onAddItemClick?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  tags?: TagEntry[]
  selectedTags?: string[]
  onTagToggle?: (tag: string) => void
  onClearFilters?: () => void
  colorMap?: Map<string, TagColorKey>
}

const PackingListToolbar = ({
  packedPercent,
  filterValue,
  onFilterChange,
  showAddGear,
  onAddFromGearClosetClick,
  onAddItemClick,
  searchValue = '',
  onSearchChange,
  tags = [],
  selectedTags = [],
  onTagToggle,
  onClearFilters,
  colorMap,
}: PackingListToolbarProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const filterCount = selectedTags.length + (searchValue !== '' ? 1 : 0)
  const hasActiveFilters = filterCount > 0

  return (
    <div>
      <Progress value={packedPercent} aria-label="Packing progress" className="h-1 rounded-none" />
      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            aria-label="Filters"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {filterCount > 0 && (
              <span
                data-testid="filter-count-badge"
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
              >
                {filterCount}
              </span>
            )}
          </Button>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filterValue}
            onValueChange={(val) => {
              if (val) onFilterChange(val as PackingListFilter)
            }}
          >
            <ToggleGroupItem value="All" aria-label="Toggle all" className="px-4">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="Packed" aria-label="Toggle packed" className="px-4">
              Packed
            </ToggleGroupItem>
            <ToggleGroupItem value="Unpacked" aria-label="Toggle unpacked" className="px-4">
              Unpacked
            </ToggleGroupItem>
          </ToggleGroup>
          {showAddGear && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Gear
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onAddFromGearClosetClick}>
                  Add from Gear Closet
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onAddItemClick}>Add item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isFiltersOpen && (
        <div className="mb-2 space-y-2 pb-1">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search items..."
              className="h-8 w-full md:max-w-xs"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={onClearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {tags.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 pb-2">
                {tags.map(({ tag, count }) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onTagToggle?.(tag)}
                      className={cn(
                        'flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all select-none',
                        isSelected
                          ? 'border-foreground/20 bg-foreground/5 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span
                        className={cn('h-2 w-2 shrink-0 rounded-full', getTagDotClass(tag, colorMap))}
                      />
                      {tag}
                      <span className="opacity-60">({count})</span>
                    </button>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}

export default PackingListToolbar
