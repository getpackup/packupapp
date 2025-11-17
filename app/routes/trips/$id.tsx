import { limit, where } from 'firebase/firestore'
import { useEffect, useMemo } from 'react'

import ChatSheet from '~/components/Chat/ChatSheet'
import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import TripDetailsSidebar from '~/components/Trip/TripDetailsSidebar'
import TripPackingList from '~/components/Trip/TripPackingList'
import { useTripByIdQuery, useTripMembersQuery } from '~/services/trips'

import type { Route } from './+types/$id'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trip Details | Packup' }]
}

export default function TripDetails({ params }: Route.ComponentProps) {
  const { id } = params

  const { data: trip, isLoading: isLoadingTrip } = useTripByIdQuery({ tripId: id })

  const constraints = useMemo(
    () =>
      trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
        ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(10)]
        : [],
    [trip?.tripMembers]
  )

  const { data: users } = useTripMembersQuery({
    tripId: id,
    constraints,
    queryOptions: {
      enabled: trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    },
  })

  useEffect(() => {
    if (trip?.name) {
      document.title = `${trip.name} | Packup`
    } else {
      document.title = 'Trip Details | Packup'
    }
  }, [trip?.name])

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Trips', href: '/trips' },
          { label: trip?.name || 'Trip Details', href: `/trips/${id}` },
        ]}
      />
      <PageContent noPadding>
        {!trip || isLoadingTrip ? (
          <FullPageSpinner what="trip details" />
        ) : (
          <div className="relative flex h-full min-h-0">
            <div className="w-2/3 overflow-y-auto p-8">
              <TripPackingList tripId={id} users={users} />
            </div>
            <div className="bg-sidebar border-sidebar-border w-1/3 overflow-y-auto border-l">
              <TripDetailsSidebar trip={trip} users={users} />
            </div>
            <div className="absolute right-4 bottom-4">
              {users && <ChatSheet trip={trip} users={users} />}
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
