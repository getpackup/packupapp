import { PackageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getItemTags } from '~/lib/getItemTags'
import { getTagDotClass } from '~/lib/tagColors'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'
import {
  useDeleteGearClosetItem,
  useRemoveGearItem,
} from '~/services/gear'
import type { GearClosetItem as GearClosetItemType } from '~/types/GearItem'

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
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import AddGearClosetItemDialog from './AddGearClosetItemDialog'
import EditGearClosetItemDialog from './EditGearClosetItemDialog'
import GearClosetItem from './GearClosetItem'

export type GearClosetItemWithMeta = GearClosetItemType & {
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
  const colorMap = useCustomTagColorMap(userId)
  const [searchValue, setSearchValue] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editItem, setEditItem] = useState<GearClosetItemWithMeta | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const { mutateAsync: deleteItem } = useDeleteGearClosetItem(userId)
  const { mutateAsync: hideItem } = useRemoveGearItem(userId)

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

  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>()
    for (const item of allItems) {
      for (const tag of getItemTags(item)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }, [allItems])

  const tagFilteredItems = useMemo(() => {
    if (selectedTags.length === 0) return allItems
    return allItems.filter((item) => {
      const itemTags = getItemTags(item)
      return selectedTags.some((tag) => itemTags.includes(tag))
    })
  }, [allItems, selectedTags])

  const sortedItems = useMemo(() => {
    return [...tagFilteredItems].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
  }, [tagFilteredItems])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleEditItem = (item: GearClosetItemWithMeta) => {
    setEditItem(item)
    setEditOpen(true)
  }

  const handleDeleteItem = (item: GearClosetItemWithMeta) => {
    if (item.isMasterItem) {
      hideItem({ gearItemId: item.id })
    } else {
      deleteItem({ itemId: item.id })
    }
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

      {allTags.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-2">
            {allTags.map(({ tag, count }) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all select-none',
                    isSelected
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', getTagDotClass(tag, colorMap))} />
                  {tag}
                  <span className="opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {allItems.length === 0 && !searchValue ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>Your gear closet is empty</EmptyTitle>
            <EmptyDescription>
              Add custom gear items or manage your tags to see master gear list items.
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
      ) : tagFilteredItems.length === 0 && selectedTags.length > 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>No items found</EmptyTitle>
            <EmptyDescription>No gear items match the selected tags</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-0.5">
          {sortedItems.map((item) => (
            <GearClosetItem
              key={item.id}
              item={item}
              onEdit={() => handleEditItem(item)}
              onDelete={() => handleDeleteItem(item)}
            />
          ))}
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
