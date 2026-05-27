import { limit, where } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { AnonymousUserBanner } from '~/components/AnonymousUserBanner'
import ChatSheet from '~/components/Chat/ChatSheet'
import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import MobileTripDetailsDrawer from '~/components/Trip/MobileTripDetailsDrawer'
import TripDetailsSidebar from '~/components/Trip/TripDetailsSidebar'
import TripPackingList from '~/components/Trip/TripPackingList'
import useAuth from '~/contexts/auth/useAuth'
import { useScreenSize } from '~/lib/use-screen-size'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const isAnonymous = useIsAnonymous()
  const { isMediumBreakpoint } = useScreenSize()
  const [isChatOpen, setIsChatOpen] = useState(() => searchParams.get('chat') === 'open')

  useEffect(() => {
    if (searchParams.get('chat') === 'open') {
      setIsChatOpen(true)
    }
  }, [searchParams])

  const handleChatOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsChatOpen(isOpen)
      if (!isOpen) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('chat')
            return next
          },
          { replace: true }
        )
      }
    },
    [setSearchParams]
  )

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
              {users && (
                <ChatSheet
                  trip={trip}
                  users={users}
                  compact
                  open={isMediumBreakpoint === false ? isChatOpen : false}
                  onOpenChange={handleChatOpenChange}
                />
              )}
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
              {isAnonymous && (
                <AnonymousUserBanner
                  primary="Invite your crew, assign gear, and add items to your shopping list."
                  secondary="Sign up free — your session isn't saved yet."
                />
              )}
              <TripPackingList tripId={id} users={users} />
            </div>
            <div className="bg-sidebar border-sidebar-border hidden w-1/3 overflow-y-auto border-l md:block">
              <TripDetailsSidebar trip={trip} users={users} />
            </div>
            <div className="absolute right-4 bottom-4 hidden md:block">
              {users && (
                <ChatSheet
                  trip={trip}
                  users={users}
                  open={isMediumBreakpoint === true ? isChatOpen : false}
                  onOpenChange={handleChatOpenChange}
                />
              )}
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
