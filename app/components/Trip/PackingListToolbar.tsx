import { ChevronDown, Plus } from 'lucide-react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Progress } from '../ui/progress'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

export type PackingListFilter = 'All' | 'Packed' | 'Unpacked'

type PackingListToolbarProps = {
  packedPercent: number
  filterValue: PackingListFilter
  onFilterChange: (value: PackingListFilter) => void
  showAddGear?: boolean
  onAddFromGearClosetClick?: () => void
  onAddItemClick?: () => void
}

const PackingListToolbar = ({
  packedPercent,
  filterValue,
  onFilterChange,
  showAddGear,
  onAddFromGearClosetClick,
  onAddItemClick,
}: PackingListToolbarProps) => {
  return (
    <div>
      <Progress value={packedPercent} aria-label="Packing progress" className="h-1 rounded-none" />
      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  )
}

export default PackingListToolbar
