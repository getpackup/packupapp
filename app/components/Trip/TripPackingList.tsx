import { useQueryClient } from '@tanstack/react-query'
import { orderBy } from 'firebase/firestore'
import { ListIcon, Plus, Tag, Wand2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { usePackingListState } from '~/contexts/globalState'
import { activityKeyToLabel } from '~/lib/gearFilterUtils'
import { getItemTags } from '~/lib/getItemTags'
import { getTagDotClass } from '~/lib/tagColors'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'
import { tripKeys } from '~/services/tripKeys'
import { useTripPackingListQuery } from '~/services/trips'
import type { ActivityTypes } from '~/types/GearItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import FullPageSpinner from '../FullPageSpinner'
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
import { Progress } from '../ui/progress'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import AddFromGearClosetDialog from './AddFromGearClosetDialog'
import AddPackingListDialog from './AddPackingListDialog'
import TripPackingListCategory from './TripPackingListCategory'

type TripPackingListProps = {
  tripId: string
  users?: User[]
  isAddGearOpen?: boolean
  onAddGearOpenChange?: (open: boolean) => void
}

const TripPackingList = ({ tripId, users, isAddGearOpen, onAddGearOpenChange }: TripPackingListProps) => {
  const { user } = useAuth()
  const colorMap = useCustomTagColorMap(user?.uid ?? '')
  const queryClient = useQueryClient()
  const trip = queryClient.getQueryData<Trip>(tripKeys.byId(tripId))

  const existingTags = useMemo(() => {
    const shared = trip?.tags ?? []
    const personal = user?.uid ? (trip?.tripMembers?.[user.uid]?.personalTags ?? []) : []
    const personalLabels = personal.map(
      (tag) => activityKeyToLabel(tag as keyof ActivityTypes) ?? tag
    )
    return [...shared, ...personalLabels]
  }, [trip?.tags, trip?.tripMembers, user?.uid])
  const checkboxSounds = useCheckboxSounds()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data: packingList, isLoading } = useTripPackingListQuery({
    tripId,
    constraints: [orderBy('name', 'asc')],
    queryOptions: {
      enabled: !!tripId,
    },
  })

  const {
    activePackingListFilter,
    setActivePackingListFilter,
    packingListSearchValue,
    setPackingListSearchValue,
  } = usePackingListState()

  useEffect(() => {
    return () => {
      setPackingListSearchValue('')
    }
  }, [setPackingListSearchValue])

  const filteredItems =
    packingList &&
    packingList.length > 0 &&
    packingList.filter((item) =>
      activePackingListFilter === 'Unpacked' ? !item.isPacked : item.isPacked
    )
  const finalItems = activePackingListFilter === 'All' ? packingList : filteredItems

  const searchedItems = useMemo(() => {
    return (
      finalItems &&
      finalItems.length &&
      finalItems.filter((i) => i.name.toLowerCase().includes(packingListSearchValue.toLowerCase()))
    )
  }, [packingListSearchValue, finalItems])

  const personalItems =
    searchedItems && searchedItems.length > 0
      ? searchedItems?.filter(
          (item) =>
            item.packedBy &&
            item.packedBy.length > 0 &&
            item.packedBy.some((i) => !i.isShared && i.uid === user?.uid)
        )
      : []

  const sharedItems =
    searchedItems && searchedItems.length > 0
      ? searchedItems?.filter(
          (item) =>
            item.packedBy && item.packedBy.length > 0 && item.packedBy.some((i) => i.isShared)
        )
      : []

  const allTags = useMemo(() => {
    if (!personalItems || personalItems.length === 0) return []
    const tagCounts = new Map<string, number>()
    for (const item of personalItems) {
      for (const tag of getItemTags(item)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }, [personalItems])

  const tagFilteredItems = useMemo(() => {
    if (!personalItems || personalItems.length === 0) return []
    if (selectedTags.length === 0) return personalItems
    return personalItems.filter((item) => {
      const itemTags = getItemTags(item)
      return selectedTags.some((tag) => itemTags.includes(tag))
    })
  }, [personalItems, selectedTags])

  const sortedPersonalItems = useMemo(() => {
    return [...tagFilteredItems].sort((a, b) => {
      if (a?.created?.seconds === b?.created?.seconds) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      }
      return b.created.toDate() > a.created.toDate() ? -1 : 1
    })
  }, [tagFilteredItems])

  const hasActiveFilters =
    packingListSearchValue !== '' || selectedTags.length > 0 || activePackingListFilter !== 'All'

  const clearAllFilters = () => {
    setPackingListSearchValue('')
    setSelectedTags([])
    setActivePackingListFilter('All')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const allVisibleItems = useMemo(
    () =>
      packingList?.filter(
        (item) =>
          item.packedBy &&
          item.packedBy.length > 0 &&
          (item.packedBy.some((i) => !i.isShared && i.uid === user?.uid) ||
            item.packedBy.some((i) => i.isShared))
      ) ?? [],
    [packingList, user?.uid]
  )

  const packedItemsLength = allVisibleItems.filter((item) => item.isPacked).length

  const packedPercent =
    allVisibleItems.length > 0
      ? Number(((packedItemsLength / allVisibleItems.length) * 100).toFixed(0))
      : 0

  return (
    <>
      {onAddGearOpenChange && (
        <AddFromGearClosetDialog
          tripId={tripId}
          existingTags={existingTags}
          open={isAddGearOpen ?? false}
          onOpenChange={onAddGearOpenChange}
        />
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="mb-4 w-full text-center">
          <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
          <Progress value={packedPercent} aria-label="Packing progress" />
        </div>
        {(packingList?.length ?? 0) > 0 && (
          <div className="mb-0 flex justify-end gap-2">
            <AddFromGearClosetDialog tripId={tripId} existingTags={existingTags}>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Add from Gear Closet
              </Button>
            </AddFromGearClosetDialog>
            <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}}>
              <Button variant="default" size="sm" className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </AddPackingListDialog>
          </div>
        )}
      </div>

      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search items..."
          className="h-8 w-full md:max-w-xs"
          value={packingListSearchValue}
          onChange={(e) => setPackingListSearchValue(e.target.value)}
        />
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={clearAllFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activePackingListFilter}
            onValueChange={(val) => {
              if (val) setActivePackingListFilter(val as 'All' | 'Packed' | 'Unpacked')
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

      {allTags.length > 0 && (
        <ScrollArea className="mb-3 w-full whitespace-nowrap">
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

      {isLoading ? (
        <FullPageSpinner what="packing list" />
      ) : (
        <div className="space-y-1">
          {users?.length && users?.length > 1 && (
            <TripPackingListCategory
              categoryName="Group items"
              items={sharedItems}
              isGroup
              sounds={checkboxSounds}
            />
          )}

          {packingList?.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListIcon />
                </EmptyMedia>
                <EmptyTitle>No items yet</EmptyTitle>
                <EmptyDescription>
                  Get started by generating a packing list or adding items manually
                </EmptyDescription>
                <EmptyContent className="flex-row justify-center gap-2">
                  <AddFromGearClosetDialog tripId={tripId} existingTags={existingTags}>
                    <Button>
                      <Wand2 className="h-4 w-4" />
                      Add from Gear Closet
                    </Button>
                  </AddFromGearClosetDialog>
                  <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}}>
                    <Button variant="outline">Add an item</Button>
                  </AddPackingListDialog>
                </EmptyContent>
              </EmptyHeader>
            </Empty>
          )}

          {(packingList?.length ?? 0) > 0 &&
          sortedPersonalItems?.length === 0 &&
          (packingListSearchValue ||
            selectedTags.length > 0 ||
            activePackingListFilter !== 'All') ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListIcon />
                </EmptyMedia>
                <EmptyTitle>No matching items</EmptyTitle>
                <EmptyDescription>
                  {packingListSearchValue
                    ? `No items match \u201c${packingListSearchValue}\u201d`
                    : activePackingListFilter === 'Packed'
                      ? 'No items have been packed yet'
                      : activePackingListFilter === 'Unpacked'
                        ? 'All items have been packed'
                        : 'No items match the selected tags'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (packingList?.length ?? 0) > 0 &&
            personalItems?.length === 0 &&
            !packingListSearchValue &&
            selectedTags.length === 0 &&
            activePackingListFilter === 'All' ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListIcon />
                </EmptyMedia>
                <EmptyTitle>No items yet</EmptyTitle>
                <EmptyDescription>
                  Get started by generating a packing list or adding items manually
                </EmptyDescription>
                <EmptyContent className="flex-row justify-center gap-2">
                  <AddFromGearClosetDialog tripId={tripId} existingTags={existingTags}>
                    <Button>
                      <Wand2 className="h-4 w-4" />
                      Add from Gear Closet
                    </Button>
                  </AddFromGearClosetDialog>
                  <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}}>
                    <Button variant="outline">Add an item</Button>
                  </AddPackingListDialog>
                </EmptyContent>
              </EmptyHeader>
            </Empty>
          ) : (
            <TripPackingListCategory
              categoryName="Personal items"
              items={sortedPersonalItems}
              sounds={checkboxSounds}
            />
          )}
        </div>
      )}
    </>
  )
}

export default TripPackingList
