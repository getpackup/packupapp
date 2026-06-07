import { Progress } from '../ui/progress'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

type PackingListFilter = 'All' | 'Packed' | 'Unpacked'

type PackingListToolbarProps = {
  packedPercent: number
  filterValue: PackingListFilter
  onFilterChange: (value: PackingListFilter) => void
}

const PackingListToolbar = ({ packedPercent, filterValue, onFilterChange }: PackingListToolbarProps) => {
  return (
    <div>
      <Progress value={packedPercent} aria-label="Packing progress" className="h-1 rounded-none" />
      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
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
  )
}

export default PackingListToolbar
