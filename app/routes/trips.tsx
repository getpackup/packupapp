import { where } from 'firebase/firestore'

import { useAuth } from '~/contexts/auth/useAuth'
import { useCollection } from '~/services/api'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
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

  const { data: trips, isLoading, error } = useCollection<Trip>('trips', constraints)

  const nonArchivedTrips = trips
    ?.filter((trip) => !trip.archived)
    .sort((a, b) => b.startDate.seconds - a.startDate.seconds)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4 text-center">Loading trips...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-600">Error loading trips</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center">Trips</h1>
      {nonArchivedTrips && nonArchivedTrips.length > 0 ? (
        <div className="w-full max-w-4xl">
          {nonArchivedTrips.map((trip) => (
            <div key={trip.id}>
              <h2>{trip.name}</h2>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No trips found</p>
      )}
    </div>
  )
}
