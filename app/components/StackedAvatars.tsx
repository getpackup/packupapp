import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { BadgeCheck, Contact, Send, UserX } from 'lucide-react'

import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent } from './ui/tooltip'

type StackedAvatarsProps = {
  tripMembers: TripMember[]
  users?: User[]
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
        const user = users?.find((user) => user.id === tripMember.uid)
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="size-16 border">
                    <AvatarImage
                      src={user.photoURL}
                      gravatarEmail={user.email}
                      alt={`${user.username} avatar`}
                    />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="mb-2 flex flex-col">
                    <span className="mb-1 text-lg leading-none">{user.displayName}</span>
                    <span className="text-sm leading-none">
                      @{user.username.toLocaleLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  {tripMember.status === TripMemberStatus.Owner && (
                    <Badge variant="primary">
                      <BadgeCheck /> Trip Creator
                    </Badge>
                  )}
                  {tripMember.status === TripMemberStatus.Pending && (
                    <Badge variant="success">
                      <Send />
                      Invited
                    </Badge>
                  )}
                  {tripMember.status === TripMemberStatus.Accepted && (
                    <Badge variant="secondary">
                      <Contact /> Trip Member
                    </Badge>
                  )}
                  {tripMember.status === TripMemberStatus.Declined && (
                    <Badge variant="destructive">
                      <UserX /> Declined
                    </Badge>
                  )}
                  {tripMember.status === TripMemberStatus.Removed && (
                    <Badge variant="destructive">
                      <UserX /> Removed
                    </Badge>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default StackedAvatars
