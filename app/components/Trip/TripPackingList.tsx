import { orderBy } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { usePackingListState } from '~/contexts/globalState'
import groupPackingList from '~/lib/groupPackingListItems'
import { useSubCollection } from '~/services/api'
import type { PackingListItem } from '~/types/PackingListItem'

import FullPageSpinner from '../FullPageSpinner'
import { Input } from '../ui/input'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import TripPackingListCategory from './TripPackingListCategory'
import TripPackingListItem from './TripPackingListItem'

type TripPackingListProps = {
  tripId: string
}

const TripPackingList = ({ tripId }: TripPackingListProps) => {
  const { user } = useAuth()
  const { data: packingList, isLoading: packingListLoading } = useSubCollection<PackingListItem[]>(
    'trips',
    'packing-list',
    tripId,
    [orderBy('category', 'asc')],
    {
      enabled: !!tripId,
    }
  )

  const [packedPercent, setPackedPercent] = useState(0)

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
      setActivePackingListFilter('All')
    }
  }, [setPackingListSearchValue, setActivePackingListFilter])

  const personalItems = packingList?.filter(
    (item) =>
      (item &&
        item.packedBy &&
        item.packedBy.length > 0 &&
        item.packedBy.some((item) => item.uid === user?.uid)) ||
      []
  )

  // filter out only current user's items that are packed
  const packedItemsLength =
    personalItems && personalItems.length > 0
      ? personalItems.filter((item) => item?.isPacked === true).length
      : 0

  useEffect(() => {
    if (personalItems && personalItems.length > 0 && packedItemsLength) {
      setPackedPercent(Number(((packedItemsLength / personalItems.length) * 100).toFixed(0)))
    }
  }, [personalItems, packedItemsLength])

  const sharedItems =
    packingList?.filter(
      (item) => item.packedBy && item.packedBy.length > 0 && item.packedBy.some((i) => i.isShared)
    ) || []

  // // take into account if we are on the personal or shared list
  // const items = useMemo(
  //   () => (activePackingListTab === TabOptions.Personal ? personalItems : sharedItems),
  //   [personalItems, sharedItems]
  // )

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

  const getGroupedFinalItems =
    searchedItems && searchedItems.length > 0
      ? groupPackingList(searchedItems, user?.uid ?? '', 'Personal')
      : []

  return (
    <>
      <div className="mb-4 text-center">
        <span className="text-muted-foreground text-sm">{packedPercent}% packed</span>
        <Progress value={packedPercent} aria-label="Packing progress" />
      </div>
      <Tabs defaultValue="personal">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="personal" className="px-8">
              Personal
            </TabsTrigger>
            <TabsTrigger value="group" className="px-8">
              Group
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search items..."
              className="h-8"
              value={packingListSearchValue}
              onChange={(e) => setPackingListSearchValue(e.target.value)}
            />
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
        </div>
        <TabsContent value="personal">
          {packingListLoading || packingList?.length === 0 ? (
            <FullPageSpinner what="packing list" />
          ) : (
            <div className="space-y-1">
              {personalItems?.length === 0 ? (
                <div className="text-muted-foreground text-sm">No personal items</div>
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
        </TabsContent>
        <TabsContent value="group">
          {sharedItems.length === 0 ? (
            <div className="text-muted-foreground text-sm">No shared group items</div>
          ) : (
            sharedItems.map((item) => (
              <TripPackingListItem
                key={item.id}
                item={item}
                isMultiSelecting={false}
                isSelected={false}
                onItemSelection={() => {}}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

export default TripPackingList
