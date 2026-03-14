import { Plus, Settings2, Tags } from 'lucide-react'
import { useMemo } from 'react'

import FullPageSpinner from '~/components/FullPageSpinner'
import AddGearClosetItemDialog from '~/components/GearCloset/AddGearClosetItemDialog'
import type { GearClosetItemWithMeta } from '~/components/GearCloset/GearClosetList'
import GearClosetList from '~/components/GearCloset/GearClosetList'
import ManageCustomTagsDialog from '~/components/GearCloset/ManageCustomTagsDialog'
import ManageTagsDialog from '~/components/GearCloset/ManageTagsDialog'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { Button } from '~/components/ui/button'
import useAuth from '~/contexts/auth/useAuth'
import {
  useGearClosetAdditionsQuery,
  useGearClosetQuery,
  useGearQuery,
} from '~/services/gear'
import type { GearItem } from '~/types/GearItem'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Gear Closet | Packup' }]
}

function masterItemToClosetItem(item: GearItem, removals: string[]): GearClosetItemWithMeta {
  return {
    id: item.id,
    name: item.name,
    tags: item.tags ?? (item.category ? [item.category] : []),
    category: item.category,
    essential: item.essential,
    weight: item.weight,
    weightUnit: item.weightUnit,
    description: item.description,
    quantity: item.quantity,
    created: item.created,
    updated: item.updated,
    isMasterItem: true,
    isRemoved: removals.includes(item.id),
  }
}

export default function GearCloset() {
  const { user } = useAuth()
  const userId = user?.uid ?? ''

  const {
    data: closet,
    isLoading: closetLoading,
  } = useGearClosetQuery({
    userId,
    queryOptions: { enabled: !!userId },
  })

  const {
    data: allGear,
    isLoading: gearLoading,
  } = useGearQuery({
    constraints: [],
    queryOptions: { enabled: !!userId },
  })

  const {
    data: additions,
    isLoading: additionsLoading,
  } = useGearClosetAdditionsQuery({
    userId,
    queryOptions: { enabled: !!userId },
  })

  const isLoading = closetLoading || gearLoading || additionsLoading
  const categories = closet?.categories ?? []
  const removals = closet?.removals ?? []

  const filteredMasterItems: GearClosetItemWithMeta[] = useMemo(() => {
    if (!allGear) return []

    return allGear
      .filter((item) => {
        if (categories.length === 0) return false
        return categories.some((cat) => (item as any)[cat] === true)
      })
      .map((item) => masterItemToClosetItem(item, removals))
  }, [allGear, categories, removals])

  const closetAdditions: GearClosetItemWithMeta[] = useMemo(() => {
    return (additions ?? []).map((a) => ({ ...a, isMasterItem: false }))
  }, [additions])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Gear Closet', href: '/gear-closet' }]} />
      <PageContent>
        {isLoading ? (
          <FullPageSpinner what="gear closet" />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gear Closet</h2>
              <div className="flex gap-2">
                <ManageTagsDialog userId={userId} currentTags={categories}>
                  <Button variant="outline" size="sm">
                    <Settings2 className="mr-1 h-4 w-4" />
                    Tags
                  </Button>
                </ManageTagsDialog>
                <ManageCustomTagsDialog userId={userId}>
                  <Button variant="outline" size="sm">
                    <Tags className="mr-1 h-4 w-4" />
                    Custom Tags
                  </Button>
                </ManageCustomTagsDialog>
                <AddGearClosetItemDialog userId={userId}>
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add item
                  </Button>
                </AddGearClosetItemDialog>
              </div>
            </div>

            <GearClosetList
              userId={userId}
              masterItems={filteredMasterItems}
              additions={closetAdditions}
            />
          </div>
        )}
      </PageContent>
    </>
  )
}
