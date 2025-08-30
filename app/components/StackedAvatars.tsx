import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { BadgeCheck } from 'lucide-react'

import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent } from './ui/tooltip'

type StackedAvatarsProps = {
  tripMembers: TripMember[]
  users: User[]
}

export const activeTripMembersOnly = (tripMembers: TripMember[]) =>
  tripMembers.filter(
    (tripMember) =>
      tripMember.status !== TripMemberStatus.Declined &&
      tripMember.status !== TripMemberStatus.Removed
  )

const StackedAvatars = ({ tripMembers, users }: StackedAvatarsProps) => {
  if (tripMembers.length === 1) {
    return null
  }

  const activeTripMembers = activeTripMembersOnly(tripMembers)
  return (
    <div className="flex -space-x-2">
      {activeTripMembers.map((tripMember) => {
        const user = users.find((user) => user.id === tripMember.uid)
        if (!user) {
          return null
        }
        return (
          <Tooltip key={tripMember.uid}>
            <TooltipTrigger>
              <div className="*:data-[slot=avatar]:ring-sidebar *:data-[slot=avatar]:ring-2">
                <Avatar>
                  <AvatarImage
                    src={user.photoURL}
                    gravatarEmail={user.email}
                    alt={`${user.username} avatar`}
                  />
                  <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex flex-col items-center gap-2 pb-2">
                @{user.username.toLocaleLowerCase()}
                {tripMember.status === TripMemberStatus.Owner && (
                  <Badge variant="primary">
                    <BadgeCheck /> Trip Creator
                  </Badge>
                )}
                {tripMember.status === TripMemberStatus.Pending && (
                  <Badge variant="secondary">Invited</Badge>
                )}
                {tripMember.status === TripMemberStatus.Accepted && (
                  <Badge variant="secondary">Trip Member</Badge>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default StackedAvatars
