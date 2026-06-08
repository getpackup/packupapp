import { where } from 'firebase/firestore'
import { Plus, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import AddShoppingListItemDialog from '~/components/ShoppingList/AddShoppingListItemDialog'
import ShoppingListFilterBar from '~/components/ShoppingList/ShoppingListFilterBar'
import ShoppingListItem from '~/components/ShoppingList/ShoppingListItem'
import { useShoppingListFilters } from '~/components/ShoppingList/useShoppingListFilters'
import { useShoppingListView } from '~/components/ShoppingList/useShoppingListView'
import { Button } from '~/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty'
import { UpgradeAccountGate } from '~/components/UpgradeAccountGate'
import useAuth from '~/contexts/auth/useAuth'
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

  const { purchaseState, setPurchaseState, sortBy, setSortBy, activeStores, setActiveStores, storeChips } =
    useShoppingListFilters(shoppingList ?? [])

  const flatList = useShoppingListView({
    items: shoppingList ?? [],
    trips: trips ?? [],
    purchaseState,
    sortBy,
    activeStores,
  })

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
          <div className="mx-auto w-full max-w-4xl">
            {(isLoadingTrips || isLoading) && <FullPageSpinner what="shopping list" />}
            {!isLoading && !isLoadingTrips && (
              <>
                <ShoppingListFilterBar
                  purchaseState={purchaseState}
                  onPurchaseStateChange={setPurchaseState}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  storeChips={storeChips}
                  activeStores={activeStores}
                  onActiveStoresChange={setActiveStores}
                />
                {flatList.length > 0 ? (
                  <div className="space-y-1">
                    {flatList.map(({ item, trip }) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        trip={trip}
                        isMultiSelecting={false}
                        isSelected={false}
                        onItemSelection={() => {}}
                        sounds={checkboxSounds}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ShoppingCart />
                      </EmptyMedia>
                      <EmptyTitle>Your shopping list is empty</EmptyTitle>
                      <EmptyDescription>
                        You have no current shopping list items to display
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </>
            )}
          </div>
        )}
      </PageContent>
    </>
  )
}
