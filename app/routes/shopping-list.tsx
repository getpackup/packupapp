import { where } from 'firebase/firestore'
import { useMemo } from 'react'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import ShoppingListCategory from '~/components/ShoppingList/ShoppingListCategory'
import useAuth from '~/contexts/auth/useAuth'
import { useShoppingListQuery } from '~/services/shoppingList'
import { useTripsQuery } from '~/services/trips'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Shopping List | Packup' }]
}

export default function ShoppingList() {
  const { user } = useAuth()

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

  return (
    <>
      <PageHeader crumbs={[{ label: 'Shopping List', href: '/shopping-list' }]} />
      <PageContent>
        <div className="flex h-full min-h-0 w-full overflow-y-auto p-8">
          <div className="mx-auto w-full max-w-4xl">
            {(isLoadingTrips || isLoading) && <FullPageSpinner what="shopping list" />}
            {!isLoading && !isLoadingTrips && (shoppingList?.length ?? 0) > 0 ? (
              <div>
                {Object.entries(groupedShoppingList).map(([tripId, items]) => (
                  <ShoppingListCategory
                    tripName={trips?.find((trip) => trip.tripId === tripId)?.name ?? ''}
                    items={items ?? []}
                    key={tripId}
                  />
                ))}
              </div>
            ) : (
              <p>No shopping list items found</p>
            )}
          </div>
        </div>
      </PageContent>
    </>
  )
}
