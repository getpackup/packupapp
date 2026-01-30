import { orderBy } from 'firebase/firestore'
import { ListIcon } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { usePackingListState } from '~/contexts/globalState'
import groupPackingList from '~/lib/groupPackingListItems'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { useTripPackingListQuery } from '~/services/trips'
import type { PackingListItem } from '~/types/PackingListItem'
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
import { Tabs } from '../ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import AddPackingListDialog from './AddPackingListDialog'
import TripPackingListCategory from './TripPackingListCategory'

type TripPackingListProps = {
  tripId: string
  users?: User[]
}

const TripPackingList = ({ tripId, users }: TripPackingListProps) => {
  const { user } = useAuth()
  const checkboxSounds = useCheckboxSounds()
  const { data: packingList, isLoading } = useTripPackingListQuery({
    tripId,
    constraints: [orderBy('category', 'asc')],
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

  // Reset packing list state when component unmounts
  useEffect(() => {
    return () => {
      setPackingListSearchValue('')
    }
  }, [setPackingListSearchValue])

  // take into account if the unpacked or packed filters are selected
  const filteredItems =
    packingList &&
    packingList.length > 0 &&
    packingList.filter((item) =>
      activePackingListFilter === 'Unpacked' ? !item.isPacked : item.isPacked
    )
  // if the filter is All, just return all the items
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

  const getGroupedFinalItems =
    personalItems && personalItems.length > 0 ? groupPackingList(personalItems) : []

  // filter out only current user's items that are packed
  const packedItemsLength =
    personalItems && personalItems.length > 0
      ? personalItems.filter((item) => item?.isPacked === true).length
      : 0

  const packedPercent =
    personalItems && personalItems.length > 0
      ? Number(((packedItemsLength / personalItems.length) * 100).toFixed(0))
      : 0

  return (
    <>
      <div className="mb-4 text-center">
        <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
        <Progress value={packedPercent} aria-label="Packing progress" />
      </div>
      <Tabs defaultValue="personal">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search items..."
              className="h-8"
              value={packingListSearchValue}
              onChange={(e) => setPackingListSearchValue(e.target.value)}
            />
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            defaultValue="All"
            onValueChange={setActivePackingListFilter}
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
                  <EmptyTitle>No items found</EmptyTitle>
                  <EmptyDescription>You have no items to pack for this trip yet</EmptyDescription>
                  <EmptyContent className="flex-row justify-center gap-2">
                    <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}}>
                      <Button>Add an item</Button>
                    </AddPackingListDialog>
                  </EmptyContent>
                </EmptyHeader>
              </Empty>
            )}

            {(packingList?.length ?? 0) > 0 && personalItems?.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListIcon />
                  </EmptyMedia>
                  <EmptyTitle>No items found</EmptyTitle>
                  <EmptyDescription>You have no items to pack for this trip yet</EmptyDescription>
                  <EmptyContent className="flex-row justify-center gap-2">
                    <AddPackingListDialog categoryName="Personal items" onItemCreated={() => {}}>
                      <Button>Add an item</Button>
                    </AddPackingListDialog>
                  </EmptyContent>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {getGroupedFinalItems &&
                  getGroupedFinalItems.length > 0 &&
                  getGroupedFinalItems.map(
                    (
                      [categoryName, packingListItems]: [string, PackingListItem[] | undefined],
                      index
                    ) => {
                      if (packingListItems === undefined) return null
                      if (categoryName && packingListItems.length > 0) {
                        const sortedItems = packingListItems.sort((a, b) => {
                          //if (a?.isPacked === b?.isPacked) {
                          // sort by name
                          if (a?.created?.seconds === b?.created?.seconds) {
                            return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                          }
                          //}
                          // sort by timestamp
                          return b.created.toDate() > a.created.toDate() ? -1 : 1
                          // sort by packed status, with checkedf items last
                          // return a.isPacked > b.isPacked ? 1 : -1
                        })

                        return (
                          <TripPackingListCategory
                            key={index}
                            categoryName={categoryName}
                            items={sortedItems}
                            sounds={checkboxSounds}
                          />
                        )
                      }
                      return null
                    }
                  )}
              </>
            )}
          </div>
        )}
      </Tabs>
    </>
  )
}

export default TripPackingList
