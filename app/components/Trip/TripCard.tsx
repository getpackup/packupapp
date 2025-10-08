import { formatDistanceToNow } from 'date-fns'
import { limit, where } from 'firebase/firestore'
import { CalendarIcon, Info, MapPinIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { formattedDateRange } from '~/lib/date'
import { useCollection } from '~/services/api'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import StackedAvatars from '../StackedAvatars'
import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

type TripCardProps = {
  trip: Trip
  showCountdown?: boolean
  showRemaining?: boolean
}

const TripCard = ({ trip, showCountdown, showRemaining }: TripCardProps) => {
  const navigate = useNavigate()

  const constraints =
    trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
      ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(6)]
      : undefined

  const { data: users } = useCollection<User[]>('users', constraints, {
    enabled: trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    queryKey: ['firebase', 'docs', 'trips', trip?.tripId, 'tripMembers'],
  })

  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:ring-ring flex cursor-pointer gap-6 rounded-lg border p-4 transition-colors duration-300"
      tabIndex={0}
      onClick={() => navigate(`/trips/${trip.id}`)}
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
            <Link to={`/trips/${trip.id}`}>
              <h2 className="mb-2 text-2xl font-bold">{trip.name}</h2>
            </Link>
            <StackedAvatars tripMembers={Object.values(trip.tripMembers)} users={users} />
          </div>
          <div className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
          </div>
          <div className="flex items-center gap-2 text-base">
            <MapPinIcon className="h-4 w-4" />
            {trip.startingPoint}
          </div>
          {trip.description && (
            <div className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              {trip.description}
            </div>
          )}
        </div>
        <div>
          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {trip.tags.map((tag: string) => (
              <Badge key={`${trip.id}-${tag}-tag`} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripCard
