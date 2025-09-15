import { where } from 'firebase/firestore'
import { useEffect } from 'react'
import { toast } from 'sonner'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import TripCard from '~/components/Trip/TripCard'
import { useAuth } from '~/contexts/auth/useAuth'
import { isBeforeToday } from '~/lib/date'
import { isAfterToday } from '~/lib/date'
import { useCollection } from '~/services/api'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/index'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trips | Packup' }]
}

export default function Trips() {
  const { user } = useAuth()

  const {
    data: trips,
    isLoading,
    error,
  } = useCollection<Trip[]>(
    'trips',
    [
      where(`tripMembers.${user?.uid}.status`, 'not-in', [
        TripMemberStatus.Declined,
        TripMemberStatus.Removed,
      ]),
    ],
    {
      enabled: !!user?.uid,
      queryKey: ['firebase', 'docs', 'trips'],
    }
  )

  const nonArchivedTrips = trips
    ?.filter((trip) => !trip.archived && trip.startDate)
    .sort((a, b) => {
      // Safety check for startDate
      if (!a.startDate || !b.startDate) return 0
      return b.startDate.seconds - a.startDate.seconds
    })

  const pendingTrips =
    user?.uid &&
    nonArchivedTrips?.filter(
      (trip) =>
        trip.tripMembers &&
        trip.tripMembers[user.uid] &&
        trip.tripMembers[user.uid].status === TripMemberStatus.Pending
    )

  const inProgressTrips = nonArchivedTrips?.filter(
    (trip) =>
      isBeforeToday(trip.startDate.seconds * 1000) && isAfterToday(trip.endDate.seconds * 1000)
  )

  const upcomingTrips = nonArchivedTrips
    ?.filter((trip) => isAfterToday(trip.startDate.seconds * 1000))
    .sort((a, b) => a.startDate.seconds - b.startDate.seconds)

  const pastTrips = nonArchivedTrips?.filter((trip) => isBeforeToday(trip.endDate.seconds * 1000))

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Trips', href: '/trips' }]} />
      <PageContent>
        <div className="flex h-full min-h-0">
          <div className="w-2/3 overflow-y-auto p-8">
            {isLoading && <FullPageSpinner what="trips" />}
            {!isLoading && nonArchivedTrips && nonArchivedTrips.length > 0 ? (
              <div className="w-full max-w-4xl space-y-4">
                {nonArchivedTrips.map((trip: Trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : !isLoading ? (
              <p className="text-gray-600">No trips found</p>
            ) : null}
          </div>
          <div className="border-sidebar-border w-1/3 overflow-y-auto border-l">calendar here?</div>
        </div>
      </PageContent>
    </>
  )
}
