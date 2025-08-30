import { orderBy } from 'firebase/firestore'

import useAuth from '~/contexts/auth/useAuth'
import { useSubCollection } from '~/services/api'
import type { PackingListItem } from '~/types/PackingListItem'

import FullPageSpinner from '../FullPageSpinner'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
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

  const personalItems = packingList?.filter(
    (item) =>
      (item &&
        item.packedBy &&
        item.packedBy.length > 0 &&
        item.packedBy.some((item) => item.uid === user?.uid)) ||
      []
  )

  const sharedItems =
    packingList?.filter(
      (item) => item.packedBy && item.packedBy.length > 0 && item.packedBy.some((i) => i.isShared)
    ) || []

  return (
    <>
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
            <Input placeholder="Search items..." className="h-8" />
            <ToggleGroup type="single" variant="outline" size="sm" defaultValue="all">
              <ToggleGroupItem value="all" aria-label="Toggle all" className="px-4">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="packed" aria-label="Toggle packed" className="px-4">
                Packed
              </ToggleGroupItem>
              <ToggleGroupItem value="unpacked" aria-label="Toggle unpacked" className="px-4">
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
                personalItems?.map((item) => <TripPackingListItem key={item.id} item={item} />)
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="group">
          {sharedItems.length === 0 ? (
            <div className="text-muted-foreground text-sm">No shared group items</div>
          ) : (
            sharedItems.map((item) => <TripPackingListItem key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

export default TripPackingList
