import { cn } from '~/lib/utils'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'

type PurchaseState = 'unpurchased' | 'purchased' | 'all'
type SortBy = 'trip' | 'priority' | 'store'

type ShoppingListFilterBarProps = {
  purchaseState: PurchaseState
  onPurchaseStateChange: (value: PurchaseState) => void
  sortBy: SortBy
  onSortByChange: (value: SortBy) => void
  storeChips: string[]
  activeStores: string[]
  onActiveStoresChange: (stores: string[]) => void
}

function ShoppingListFilterBar({
  purchaseState,
  onPurchaseStateChange,
  sortBy,
  onSortByChange,
  storeChips,
  activeStores,
  onActiveStoresChange,
}: ShoppingListFilterBarProps) {
  const toggleStore = (store: string) => {
    onActiveStoresChange(
      activeStores.includes(store)
        ? activeStores.filter((s) => s !== store)
        : [...activeStores, store]
    )
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={purchaseState}
          onValueChange={(val) => {
            if (val) onPurchaseStateChange(val as PurchaseState)
          }}
        >
          <ToggleGroupItem value="unpurchased" aria-label="Show unpurchased">
            Unpurchased
          </ToggleGroupItem>
          <ToggleGroupItem value="purchased" aria-label="Show purchased">
            Purchased
          </ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="Show all">
            All
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={sortBy}
          onValueChange={(val) => {
            if (val) onSortByChange(val as SortBy)
          }}
        >
          <ToggleGroupItem value="trip" aria-label="Sort by trip">
            Trip
          </ToggleGroupItem>
          <ToggleGroupItem value="priority" aria-label="Sort by priority">
            Priority
          </ToggleGroupItem>
          <ToggleGroupItem value="store" aria-label="Sort by store">
            Store
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {storeChips.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-2">
            {storeChips.map((store) => {
              const isSelected = activeStores.includes(store)
              return (
                <button
                  key={store}
                  type="button"
                  onClick={() => toggleStore(store)}
                  className={cn(
                    'flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all select-none',
                    isSelected
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {store}
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}

export default ShoppingListFilterBar
