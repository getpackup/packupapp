import { where } from 'firebase/firestore'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import TripCard from '~/components/Trip/TripCard'
import { useAuth } from '~/contexts/auth/useAuth'
import { isBeforeToday } from '~/lib/date'
import { isAfterToday } from '~/lib/date'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

// Helper function to group trips by year
function groupTripsByYear(trips: Trip[]): { [year: string]: Trip[] } {
  return trips.reduce(
    (groups, trip) => {
      const year = new Date(trip.startDate.seconds * 1000).getFullYear().toString()
      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(trip)
      return groups
    },
    {} as { [year: string]: Trip[] }
  )
}

import { PlusCircle } from 'lucide-react'
import { Link } from 'react-router'

import { Logo } from '~/components/Logo'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useTripsQuery } from '~/services/trips'

import type { Route } from './+types/index'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trips | Packup' }]
}

export default function Trips() {
  const { user } = useAuth()

  const constraints = useMemo(
    () => [
      where(`tripMembers.${user?.uid}.status`, 'not-in', [
        TripMemberStatus.Declined,
        TripMemberStatus.Removed,
      ]),
    ],
    [user?.uid]
  )

  const {
    data: trips,
    isLoading,
    error,
    refetch,
  } = useTripsQuery({
    constraints,
    queryOptions: {
      enabled: !!user?.uid,
    },
  })

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

  const pastTrips = nonArchivedTrips
    ?.filter((trip) => isBeforeToday(trip.endDate.seconds * 1000))
    .sort((a, b) => b.startDate.seconds - a.startDate.seconds) // Sort chronologically (most recent first)

  const pastTripsByYear = pastTrips ? groupTripsByYear(pastTrips) : {}

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Trips', href: '/trips' }]} />
      <PageContent>
        <div className="">
          <div className="mx-auto w-full max-w-4xl">
            {isLoading && <FullPageSpinner what="trips" />}
            {!isLoading && nonArchivedTrips && nonArchivedTrips.length > 0 && (
              <div className="space-y-4">
                {/* Pending Trips */}
                {pendingTrips && pendingTrips.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Pending invitations</h2>
                    <div className="space-y-4">
                      {pendingTrips.map((trip: Trip) => (
                        <TripCard
                          key={trip.tripId}
                          trip={trip}
                          isPending
                          showCountdown
                          refetch={refetch}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress Trips */}
                {inProgressTrips && inProgressTrips.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">In Progress</h2>
                    <div className="space-y-4">
                      {inProgressTrips.map((trip: Trip) => (
                        <TripCard key={trip.tripId} trip={trip} showRemaining />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Trips */}
                {upcomingTrips && upcomingTrips.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Upcoming</h2>
                    <div className="space-y-4">
                      {upcomingTrips.map((trip: Trip) => (
                        <TripCard key={trip.tripId} trip={trip} showCountdown />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Trips grouped by year */}
                {Object.keys(pastTripsByYear).length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Past trips</h2>
                    {Object.keys(pastTripsByYear)
                      .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years descending (newest first)
                      .map((year) => (
                        <div key={year} className="space-y-4">
                          <Badge variant="default">{year}</Badge>
                          <div className="space-y-4">
                            {pastTripsByYear[year]
                              .sort((a, b) => b.startDate.seconds - a.startDate.seconds) // Sort chronologically within year
                              .map((trip: Trip) => (
                                <TripCard key={trip.tripId} trip={trip} />
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <p className="text-muted-foreground py-24 text-center text-sm">
                  You've reached the end of the list.{' '}
                  <Link to="/trips/new" className="font-bold hover:underline">
                    Create a new trip?
                  </Link>
                </p>
              </div>
            )}
            {!isLoading && nonArchivedTrips && nonArchivedTrips.length === 0 && (
              <div className="mx-auto flex max-w-md flex-col items-center space-y-8 text-center">
                <Logo className="size-16" fill="var(--muted-foreground)" />
                <h2 className="text-2xl font-bold">Welcome, adventurer!</h2>
                <p>
                  No trips found yet. Create your first trip and start packing for your next
                  adventure.
                </p>
                <Button asChild variant="accent" className="group">
                  <Link to="/trips/new">
                    <PlusCircle className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />

                    <span className="truncate">Create a new trip</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </>
  )
}
