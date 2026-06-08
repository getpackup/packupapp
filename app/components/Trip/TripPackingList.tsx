import { useQueryClient } from '@tanstack/react-query'
import { orderBy } from 'firebase/firestore'
import { ListIcon, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { usePackingListState } from '~/contexts/globalState'
import { activityKeyToLabel } from '~/lib/gearFilterUtils'
import { getItemTags } from '~/lib/getItemTags'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
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
import AddFromGearClosetDialog from './AddFromGearClosetDialog'
import AddPackingListDialog from './AddPackingListDialog'
import PackingListToolbar from './PackingListToolbar'
import TripPackingListCategory from './TripPackingListCategory'

type TripPackingListProps = {
  tripId: string
  users?: User[]
  isAddGearOpen?: boolean
  onAddGearOpenChange?: (open: boolean) => void
}

const TripPackingList = ({
  tripId,
  users,
  isAddGearOpen,
  onAddGearOpenChange,
}: TripPackingListProps) => {
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
  const [isGearClosetOpen, setIsGearClosetOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
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

  const renderPersonalItems = () => {
    const hasItems = (packingList?.length ?? 0) > 0

    if (hasItems && (sortedPersonalItems?.length ?? 0) === 0 && hasActiveFilters) {
      let description = 'No items match the selected tags'
      if (packingListSearchValue) {
        description = `No items match “${packingListSearchValue}”`
      } else if (activePackingListFilter === 'Packed') {
        description = 'No items have been packed yet'
      } else if (activePackingListFilter === 'Unpacked') {
        description = 'All items have been packed'
      }

      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListIcon />
            </EmptyMedia>
            <EmptyTitle>No matching items</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    if (hasItems && (personalItems?.length ?? 0) === 0 && !hasActiveFilters) {
      return (
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
              <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}} tripTags={existingTags}>
                <Button variant="outline">Add an item</Button>
              </AddPackingListDialog>
            </EmptyContent>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <TripPackingListCategory
        categoryName="Personal items"
        items={sortedPersonalItems}
        sounds={checkboxSounds}
        tripTags={existingTags}
      />
    )
  }

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
      <AddFromGearClosetDialog
        tripId={tripId}
        existingTags={existingTags}
        open={isGearClosetOpen}
        onOpenChange={setIsGearClosetOpen}
      />
      <AddPackingListDialog
        categoryName="Personal items"
        onItemCreated={() => {}}
        tripTags={existingTags}
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
      />
      <PackingListToolbar
        packedPercent={packedPercent}
        filterValue={activePackingListFilter}
        onFilterChange={setActivePackingListFilter}
        showAddGear={(packingList?.length ?? 0) > 0}
        onAddFromGearClosetClick={() => setIsGearClosetOpen(true)}
        onAddItemClick={() => setIsAddItemOpen(true)}
        searchValue={packingListSearchValue}
        onSearchChange={setPackingListSearchValue}
        tags={allTags}
        selectedTags={selectedTags}
        onTagToggle={toggleTag}
        onClearFilters={clearAllFilters}
        colorMap={colorMap}
      />

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
              tripTags={existingTags}
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
                  <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}} tripTags={existingTags}>
                    <Button variant="outline">Add an item</Button>
                  </AddPackingListDialog>
                </EmptyContent>
              </EmptyHeader>
            </Empty>
          )}

          {renderPersonalItems()}
        </div>
      )}
    </>
  )
}

export default TripPackingList
