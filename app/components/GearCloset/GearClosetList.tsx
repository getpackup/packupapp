import { PackageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getGroupKey } from '~/lib/getItemTags'
import {
  useDeleteGearClosetItem,
  useRemoveGearItem,
  useRestoreGearItem,
} from '~/services/gear'
import type { GearClosetItem } from '~/types/GearItem'

import { Button } from '../ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty'
import { Input } from '../ui/input'
import AddGearClosetItemDialog from './AddGearClosetItemDialog'
import EditGearClosetItemDialog from './EditGearClosetItemDialog'
import GearClosetCategory from './GearClosetCategory'

export type GearClosetItemWithMeta = GearClosetItem & {
  category?: string
  isRemoved?: boolean
  isMasterItem?: boolean
}

type GearClosetListProps = {
  userId: string
  masterItems: GearClosetItemWithMeta[]
  additions: GearClosetItemWithMeta[]
}

const GearClosetList = ({ userId, masterItems, additions }: GearClosetListProps) => {
  const [searchValue, setSearchValue] = useState('')
  const [editItem, setEditItem] = useState<GearClosetItemWithMeta | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const { mutateAsync: deleteItem } = useDeleteGearClosetItem(userId)
  const { mutateAsync: hideItem } = useRemoveGearItem(userId)
  const { mutateAsync: restoreItem } = useRestoreGearItem(userId)

  const allItems = useMemo(() => {
    const combined = [
      ...masterItems.filter((i) => !i.isRemoved),
      ...additions.map((a) => ({ ...a, isMasterItem: false })),
    ]

    if (!searchValue) return combined
    return combined.filter((item) =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [masterItems, additions, searchValue])

  const grouped = useMemo(() => {
    const groups = Object.entries(Object.groupBy(allItems, (item) => getGroupKey(item)))
    return groups.sort(([a], [b]) => a.localeCompare(b))
  }, [allItems])

  const handleEditItem = (item: GearClosetItemWithMeta) => {
    setEditItem(item)
    setEditOpen(true)
  }

  const handleDeleteItem = (itemId: string) => {
    deleteItem({ itemId })
  }

  const handleHideItem = (itemId: string) => {
    hideItem({ gearItemId: itemId })
  }

  const handleRestoreItem = (itemId: string) => {
    restoreItem({ gearItemId: itemId })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search gear..."
          className="h-8 max-w-xs"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {allItems.length === 0 && !searchValue ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>Your gear closet is empty</EmptyTitle>
            <EmptyDescription>
              Add custom gear items or manage your categories to see master gear list items.
            </EmptyDescription>
            <EmptyContent className="flex-row justify-center gap-2">
              <AddGearClosetItemDialog userId={userId}>
                <Button>Add gear item</Button>
              </AddGearClosetItemDialog>
            </EmptyContent>
          </EmptyHeader>
        </Empty>
      ) : allItems.length === 0 && searchValue ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>No items found</EmptyTitle>
            <EmptyDescription>No gear items match &ldquo;{searchValue}&rdquo;</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-1">
          {grouped.map(([categoryName, items]) => {
            if (!items || items.length === 0) return null
            return (
              <GearClosetCategory
                key={categoryName}
                categoryName={categoryName}
                items={items}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onHideItem={handleHideItem}
                onRestoreItem={handleRestoreItem}
              />
            )
          })}
        </div>
      )}

      <EditGearClosetItemDialog
        userId={userId}
        item={editItem}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}

export default GearClosetList
