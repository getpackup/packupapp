import { where } from 'firebase/firestore'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { useAuth } from '~/contexts/auth/useAuth'
import { useCollection } from '~/services/api'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/index'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trips | Packup' }]
}

export default function Trips() {
  const { user } = useAuth()

  const constraints = user?.uid
    ? [
        where(`tripMembers.${user.uid}.status`, 'not-in', [
          TripMemberStatus.Declined,
          TripMemberStatus.Removed,
        ]),
      ]
    : []

  const { data: trips, isLoading, error } = useCollection<Trip[]>('trips', constraints)

  const nonArchivedTrips = trips
    ?.filter((trip) => !trip.archived && trip.startDate)
    .sort((a, b) => {
      // Safety check for startDate
      if (!a.startDate || !b.startDate) return 0
      return b.startDate.seconds - a.startDate.seconds
    })

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Trips', href: '/trips' }]} />
      <PageContent>
        <div className="p-8">
          {isLoading && <FullPageSpinner what="trips" />}
          {!isLoading && nonArchivedTrips && nonArchivedTrips.length > 0 ? (
            <div className="w-full max-w-4xl">
              {nonArchivedTrips.map((trip) => (
                <div key={trip.id}>
                  <Link to={`/trips/${trip.id}`}>{trip.name}</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No trips found</p>
          )}
        </div>
      </PageContent>
    </>
  )
}
