import { limit, where } from 'firebase/firestore'
import { useEffect } from 'react'
import { toast } from 'sonner'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import TripDetailsSidebar from '~/components/Trip/TripDetailsSidebar'
import TripPackingList from '~/components/Trip/TripPackingList'
import { useCollection, useDocument } from '~/services/api'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import type { Route } from './+types/$id'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trip Details | Packup' }]
}

export default function TripDetails({ params }: Route.ComponentProps) {
  const { id } = params

  const { data: trip, isRefetching } = useDocument<Trip>('trips', id)

  useEffect(() => {
    if (trip?.name) {
      document.title = `${trip.name} | Packup`
    } else {
      document.title = 'Trip Details | Packup'
    }
  }, [trip?.name])

  useEffect(() => {
    if (isRefetching) {
      toast.info('Checking for trip updates...')
    }
  }, [isRefetching])

  const constraints =
    trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
      ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(6)]
      : undefined

  const { data: users } = useCollection<User[]>('users', constraints, {
    enabled: trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    queryKey: ['firebase', 'docs', 'trips', trip?.tripId, 'tripMembers'],
  })

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Trips', href: '/trips' },
          { label: trip?.name || 'Trip Details', href: `/trips/${id}` },
        ]}
      />
      <PageContent>
        {!trip ? (
          <FullPageSpinner what="trip details" />
        ) : (
          <div className="flex h-full min-h-0">
            <div className="w-2/3 overflow-y-auto p-8">
              <TripPackingList tripId={id} users={users} />
            </div>
            <div className="border-sidebar-border w-1/3 overflow-y-auto border-l">
              <TripDetailsSidebar trip={trip} users={users} />
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
