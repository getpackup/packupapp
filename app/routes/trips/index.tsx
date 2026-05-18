import { where } from 'firebase/firestore'
import { PlusCircle } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { AnonymousUserBanner } from '~/components/AnonymousUserBanner'
import FullPageSpinner from '~/components/FullPageSpinner'
import { Logo } from '~/components/Logo'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import TripCard from '~/components/Trip/TripCard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { useAuth } from '~/contexts/auth/useAuth'
import { isAfterToday, isBeforeToday } from '~/lib/date'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useTripsQuery } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/index'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trips | Packup' }]
}

type TripWithStatus = Trip & {
  status: 'pending' | 'in-progress' | 'upcoming' | 'past'
}

// Helper function to group trips by year
function groupTripsByYear(trips: TripWithStatus[]): { [year: string]: TripWithStatus[] } {
  return trips.reduce(
    (groups, trip) => {
      const year = new Date(trip.startDate.seconds * 1000).getFullYear().toString()
      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(trip)
      return groups
    },
    {} as { [year: string]: TripWithStatus[] }
  )
}

export default function Trips() {
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()

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

  // Add status to each trip and filter out archived trips
  const tripsWithStatus = useMemo(() => {
    if (!trips || !user?.uid) return []

    return trips
      .filter((trip) => !trip.archived && trip.startDate)
      .map((trip): TripWithStatus => {
        const isPending = trip.tripMembers?.[user.uid]?.status === TripMemberStatus.Pending
        const isInProgress =
          isBeforeToday(trip.startDate.seconds * 1000) && isAfterToday(trip.endDate.seconds * 1000)
        const isUpcoming = isAfterToday(trip.startDate.seconds * 1000)

        let status: TripWithStatus['status'] = 'past'
        if (isPending) status = 'pending'
        else if (isInProgress) status = 'in-progress'
        else if (isUpcoming) status = 'upcoming'

        return { ...trip, status }
      })
      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
  }, [trips, user?.uid])

  const tripsByYear = groupTripsByYear(tripsWithStatus)
  const sortedYears = Object.keys(tripsByYear).sort((a, b) => parseInt(b) - parseInt(a))

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Trips', href: '/trips' }]} />
      <PageContent>
        <div className="mx-auto w-full max-w-3xl">
          {isAnonymous && (
            <AnonymousUserBanner
              primary="Pack together — assign gear, chat in-trip, and shop for what you need."
              secondary="Sign up free — your session isn't saved yet."
            />
          )}
          {isLoading && <FullPageSpinner what="trips" />}
          {!isLoading && tripsWithStatus.length > 0 && (
            <>
              {sortedYears.map((year) => (
                <div key={year} className="flex w-full flex-col xl:-ml-18 xl:w-[calc(100%+4.5rem)] xl:flex-row xl:gap-6">
                  <div className="shrink-0 py-2 md:w-12 md:py-0">
                    <div className="xl:sticky xl:top-0 xl:py-4">
                      <Badge variant="default" className="text-sm">
                        {year}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full space-y-4 pb-4 md:py-4">
                    {tripsByYear[year]
                      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
                      .map((trip) => (
                        <TripCard
                          key={trip.tripId}
                          trip={trip}
                          isPending={trip.status === 'pending'}
                          showCountdown={trip.status === 'upcoming' || trip.status === 'pending'}
                          showRemaining={trip.status === 'in-progress'}
                          refetch={refetch}
                        />
                      ))}
                  </div>
                </div>
              ))}

              <p className="text-muted-foreground py-24 text-center text-sm">
                You've reached the end of the list.{' '}
                <Link to="/trips/new" className="font-bold hover:underline">
                  Create a new trip?
                </Link>
              </p>
            </>
          )}
          {!isLoading && tripsWithStatus.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Logo fill="var(--muted-foreground)" />
                </EmptyMedia>
                <EmptyTitle>Welcome, adventurer!</EmptyTitle>
                <EmptyDescription>
                  No trips found yet. Create your first trip and start packing for your next
                  adventure.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="accent" size="lg" asChild>
                  <Link to="/trips/new">
                    <PlusCircle className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                    Add new trip
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </PageContent>
    </>
  )
}
