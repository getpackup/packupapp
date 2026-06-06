import { where } from 'firebase/firestore'
import { Plus, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import AddShoppingListItemDialog from '~/components/ShoppingList/AddShoppingListItemDialog'
import ShoppingListCategory from '~/components/ShoppingList/ShoppingListCategory'
import { Button } from '~/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { UpgradeAccountGate } from '~/components/UpgradeAccountGate'
import useAuth from '~/contexts/auth/useAuth'
import { isBeforeToday } from '~/lib/date'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useShoppingListQuery } from '~/services/shoppingList'
import { useTripsQuery } from '~/services/trips'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Shopping List | Packup' }]
}

export default function ShoppingList() {
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const checkboxSounds = useCheckboxSounds()

  const constraints = useMemo(
    () => (user?.uid ? [where('userId', '==', user.uid)] : []),
    [user?.uid]
  )

  const { data: shoppingList, isLoading } = useShoppingListQuery({
    constraints,
  })

  const tripConstraints = useMemo(
    () => [
      where(`tripMembers.${user?.uid}.status`, 'not-in', [
        TripMemberStatus.Declined,
        TripMemberStatus.Removed,
      ]),
    ],
    [user?.uid]
  )

  const { data: trips, isLoading: isLoadingTrips } = useTripsQuery({
    constraints: tripConstraints,
    queryOptions: {
      enabled: !!user?.uid,
    },
  })

  const groupedShoppingList = useMemo(() => {
    if (!shoppingList) return {}
    // group shopping list by tripId
    return Object.groupBy(shoppingList, (item) => item.tripId)
  }, [shoppingList])

  const sortedGroupedShoppingList = useMemo(() => {
    if (!groupedShoppingList || !trips) return []

    // Convert groupedShoppingList to entries and sort by trip.startDate
    return Object.entries(groupedShoppingList).sort(([tripIdA], [tripIdB]) => {
      const tripA = trips.find((trip) => trip.tripId === tripIdA)
      const tripB = trips.find((trip) => trip.tripId === tripIdB)

      // If either trip is not found, place it at the end
      if (!tripA && !tripB) return 0
      if (!tripA) return 1
      if (!tripB) return -1

      // Compare startDate timestamps (earliest first)
      const startDateA = tripA.startDate?.seconds ?? 0
      const startDateB = tripB.startDate?.seconds ?? 0

      return startDateA - startDateB
    })
  }, [groupedShoppingList, trips])

  const { currentTrips, pastTrips } = useMemo(() => {
    if (!sortedGroupedShoppingList || !trips) {
      return { currentTrips: [], pastTrips: [] }
    }

    const current: typeof sortedGroupedShoppingList = []
    const past: typeof sortedGroupedShoppingList = []

    sortedGroupedShoppingList.forEach(([tripId, items]) => {
      const trip = trips.find((t) => t.tripId === tripId)
      if (!trip || !trip.endDate) {
        // If trip not found or no endDate, treat as current
        current.push([tripId, items])
        return
      }

      const isPast = isBeforeToday(trip.endDate.seconds * 1000)
      if (isPast) {
        past.push([tripId, items])
      } else {
        current.push([tripId, items])
      }
    })

    // Sort past trips by startDate descending (most recent first)
    past.sort(([tripIdA], [tripIdB]) => {
      const tripA = trips.find((trip) => trip.tripId === tripIdA)
      const tripB = trips.find((trip) => trip.tripId === tripIdB)

      if (!tripA && !tripB) return 0
      if (!tripA) return 1
      if (!tripB) return -1

      const startDateA = tripA.startDate?.seconds ?? 0
      const startDateB = tripB.startDate?.seconds ?? 0

      return startDateB - startDateA // Descending order for past trips
    })

    return { currentTrips: current, pastTrips: past }
  }, [sortedGroupedShoppingList, trips])

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Shopping List', href: '/shopping-list' }]}
        actions={
          !isAnonymous ? (
            <AddShoppingListItemDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              }
            />
          ) : undefined
        }
      />
      <PageContent>
        {isAnonymous ? (
          <UpgradeAccountGate message="Create an account to see everything you need to buy before your trips.">
            <div />
          </UpgradeAccountGate>
        ) : (
          <div className="">
            <div className="mx-auto w-full max-w-4xl">
              <div>
                <Tabs defaultValue="current">
                  <TabsList>
                    <TabsTrigger value="current">Current</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                  </TabsList>
                  {(isLoadingTrips || isLoading) && <FullPageSpinner what="shopping list" />}
                  {!isLoading && !isLoadingTrips && (shoppingList?.length ?? 0) > 0 ? (
                    <>
                      <TabsContent value="current">
                        {currentTrips.length > 0 ? (
                          currentTrips.map(([tripId, items]) => (
                            <ShoppingListCategory
                              trip={trips?.find((trip) => trip.tripId === tripId)!}
                              items={items ?? []}
                              key={tripId}
                              sounds={checkboxSounds}
                            />
                          ))
                        ) : (
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <ShoppingCart />
                              </EmptyMedia>
                              <EmptyTitle>Your current shopping list is empty</EmptyTitle>
                              <EmptyDescription>
                                You have no current shopping list items to display
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </TabsContent>
                      <TabsContent value="past">
                        {pastTrips.length > 0 ? (
                          pastTrips.map(([tripId, items]) => (
                            <ShoppingListCategory
                              trip={trips?.find((trip) => trip.tripId === tripId)!}
                              items={items ?? []}
                              key={tripId}
                              sounds={checkboxSounds}
                            />
                          ))
                        ) : (
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <ShoppingCart />
                              </EmptyMedia>
                              <EmptyTitle>Your past shopping list is empty</EmptyTitle>
                              <EmptyDescription>
                                You have no past shopping list items to display
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </TabsContent>
                    </>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ShoppingCart />
                        </EmptyMedia>
                        <EmptyTitle>Your shopping list is empty</EmptyTitle>
                        <EmptyDescription>
                          You have no current or past shopping list items to display
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
