import { limit, where } from 'firebase/firestore'
import { Info, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import ChatSheet from '~/components/Chat/ChatSheet'
import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import MobileTripDetailsDrawer from '~/components/Trip/MobileTripDetailsDrawer'
import TripDetailsSidebar from '~/components/Trip/TripDetailsSidebar'
import TripPackingList from '~/components/Trip/TripPackingList'
import { Button } from '~/components/ui/button'
import useAuth from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useTripByIdQuery, useTripMembersQuery } from '~/services/trips'

import type { Route } from './+types/$id'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trip Details | Packup' }]
}

export default function TripDetails({ params }: Route.ComponentProps) {
  const { id } = params
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAnonymous = useIsAnonymous()
  const [showBanner, setShowBanner] = useState(true)

  const { data: trip, isLoading: isLoadingTrip } = useTripByIdQuery({ tripId: id })

  useEffect(() => {
    if (!trip || isLoadingTrip || !user) return
    const isMember = user.uid in (trip.tripMembers ?? {})
    if (!isMember) {
      navigate('/trips', { replace: true })
    }
  }, [trip, isLoadingTrip, user, navigate])

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
        actions={
          trip && (
            <div className="flex items-center gap-1 md:hidden">
              <MobileTripDetailsDrawer trip={trip} users={users} />
              {users && <ChatSheet trip={trip} users={users} compact />}
            </div>
          )
        }
      />
      <PageContent noPadding>
        {!trip || isLoadingTrip ? (
          <FullPageSpinner what="trip details" />
        ) : (
          <div className="relative flex h-full min-h-0 flex-col md:flex-row">
            <div className="flex-1 overflow-y-auto p-4 md:w-2/3 md:p-8">
              {isAnonymous && showBanner && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <Info className="size-4 shrink-0" />
                    <span>Sign up to save this trip and access it from any device.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="accent" size="sm" asChild>
                      <Link to="/signup">
                        <UserPlus className="size-3" />
                        Sign up
                      </Link>
                    </Button>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}
              <TripPackingList tripId={id} users={users} />
            </div>
            <div className="bg-sidebar border-sidebar-border hidden w-1/3 overflow-y-auto border-l md:block">
              <TripDetailsSidebar trip={trip} users={users} />
            </div>
            <div className="absolute right-4 bottom-4 hidden md:block">
              {users && <ChatSheet trip={trip} users={users} />}
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
