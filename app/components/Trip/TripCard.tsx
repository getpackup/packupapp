import { formatDistanceToNow } from 'date-fns'
import { limit, where } from 'firebase/firestore'
import { CalendarIcon, Check, MapPinIcon, MessageSquareMore, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import useAuth from '~/contexts/auth/useAuth'
import { createSystemMessage } from '~/lib/chat'
import { formattedDate, formattedDateRange } from '~/lib/date'
import { cn } from '~/lib/utils'
import { useCreateChatMessage, useTripMembersQuery, useUpdateTrip } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import StackedAvatars from '../StackedAvatars'
import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type TripCardProps = {
  trip: Trip
  showCountdown?: boolean
  showRemaining?: boolean
  isPending?: boolean
  refetch?: () => void
}

const TripCard = ({ trip, showCountdown, showRemaining, isPending, refetch }: TripCardProps) => {
  const navigate = useNavigate()

  const { user } = useAuth()

  const { mutateAsync: updateTripAsync } = useUpdateTrip(trip.tripId)
  const { mutateAsync: sendMessage } = useCreateChatMessage()

  const constraints = useMemo(
    () =>
      trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
        ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(10)]
        : [],
    [trip?.tripMembers]
  )

  const { data: users } = useTripMembersQuery({
    tripId: trip.tripId,
    constraints,
    queryOptions: {
      enabled: trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    },
  })

  const getInvitedByText = () => {
    if (!user?.uid || !trip || !users || !isPending) return null

    let inviter: string | undefined
    let invitedAt: number | undefined

    if (users && Object.keys(users).length > 1) {
      if (trip && trip.tripMembers && Object.keys(trip.tripMembers).length > 0) {
        if (user.uid && trip.tripMembers[user.uid].invitedBy) {
          const invitedBy = trip.tripMembers[user.uid].invitedBy

          if (invitedBy && typeof invitedBy === 'string') {
            const inviterUser = users.find((user) => user.id === invitedBy)?.displayName

            inviter = inviterUser || undefined
            invitedAt = trip.tripMembers[user.uid].invitedAt.seconds * 1000
          }
        }
      }
    }

    return inviter && invitedAt
      ? `${inviter} invited you on ${formattedDate(new Date(invitedAt))}`
      : null
  }

  const sendTripMemberStatusMessage = async (status: TripMemberStatus) => {
    if (!user?.uid || !user?.username) return

    const newMessage = createSystemMessage(
      `@${user.username} has ${status.toLowerCase()} the trip invitation.`
    )
    await sendMessage({ tripId: trip.tripId, data: newMessage })
  }

  const acceptOrDeclineInvitation = async (status: TripMemberStatus) => {
    if (trip && user?.uid) {
      const payload = {
        [`tripMembers.${user.uid}`]: {
          uid: user.uid,
          invitedAt: trip?.tripMembers[`${user.uid}`].invitedAt,
          acceptedAt: status === TripMemberStatus.Accepted ? new Date() : '',
          declinedAt: status === TripMemberStatus.Declined ? new Date() : '',
          status,
        },
      }

      await updateTripAsync({ data: payload }).then(async () => {
        await sendTripMemberStatusMessage(status)
        if (status === TripMemberStatus.Accepted) {
          toast.success(`Excellent! Let's start thinking about what you'll need to bring next 🤙`)
          navigate(`/trips/${trip.tripId}/generator`)
        }
        if (status === TripMemberStatus.Declined) {
          toast.success(`Bummer... You have successfully declined to go on the trip 😔`)
          // refetch the trips collection so the pending trip is removed
          refetch?.()
        }
      })
    }
  }

  return (
    <div
      className={cn(
        'focus:ring-ring flex gap-6 rounded-lg border p-4 transition-colors duration-300',
        {
          'cursor-initial': isPending,
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer': !isPending,
        }
      )}
      tabIndex={0}
      onClick={() => (isPending ? null : navigate(`/trips/${trip.tripId}`))}
    >
      <div className="relative w-2/5">
        {showRemaining && (
          <div className="absolute top-2 left-2 z-10 text-xs">
            <Badge variant="default">
              {formatDistanceToNow(trip.endDate.seconds * 1000, { addSuffix: false })} remaining
            </Badge>
          </div>
        )}
        {showCountdown && (
          <div className="absolute top-2 left-2 z-10 text-xs">
            <Badge variant="default">
              {formatDistanceToNow(trip.startDate.seconds * 1000, { addSuffix: true })}
            </Badge>
          </div>
        )}

        <AspectRatio ratio={1.5} className="pointer-events-none overflow-hidden rounded-sm border">
          {!trip.headerImage && !!trip.lat && !!trip.lng && (
            <StaticMapImage
              lat={trip.lat}
              lng={trip.lng}
              height="100%"
              width="100%"
              zoom={10}
              label={trip.startingPoint}
            />
          )}
          {trip.headerImage && (
            <img src={trip?.headerImage} alt={trip?.name} className="h-full w-full object-cover" />
          )}
        </AspectRatio>
      </div>
      <div className="flex w-3/5 flex-col">
        <div>
          <div className="flex items-start justify-between gap-4">
            {isPending ? (
              <h2 className="mb-2 text-2xl font-bold">{trip.name}</h2>
            ) : (
              <Link to={`/trips/${trip.tripId}`}>
                <h2 className="mb-2 text-2xl font-bold">{trip.name}</h2>
              </Link>
            )}

            <StackedAvatars tripMembers={Object.values(trip.tripMembers)} users={users} />
          </div>
          <div className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
            </span>
            {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
          </div>
          <div className="flex items-center gap-2 text-base">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{trip.startingPoint}</span>
          </div>
          {trip.description && (
            <div className="flex items-center gap-2 text-base">
              <MessageSquareMore className="h-4 w-4 shrink-0" />
              <span className="truncate">{trip.description}</span>
            </div>
          )}
        </div>
        <div>
          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {trip.tags.map((tag: string) => (
              <Badge key={`${trip.tripId}-${tag}-tag`} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {isPending && (
          <div className="mt-auto">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm italic">{getInvitedByText()}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="success"
                  onClick={() => acceptOrDeclineInvitation(TripMemberStatus.Accepted)}
                >
                  <Check /> Accept
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => acceptOrDeclineInvitation(TripMemberStatus.Declined)}
                >
                  <X /> Decline
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TripCard
