import { Timestamp } from 'firebase/firestore'
import { UserPlus, X } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import UserMediaObject from '~/components/UserMediaObject'
import { UserSearchCombobox } from '~/components/UserSearchCombobox'
import useAuth from '~/contexts/auth/useAuth'
import { useFriendUsersQuery } from '~/services/friends'
import { TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import AnimatedContainer from '../../AnimatedContainer'
import TripPartyMemberBadge from '../TripPartyMemberBadge'

type MembersStepProps = {
  tripMembers: (User & { sendFriendRequest?: boolean })[]
  setTripMembers: (members: (User & { sendFriendRequest?: boolean })[]) => void
}

const MembersStep = ({ tripMembers, setTripMembers }: MembersStepProps) => {
  const { user } = useAuth()
  const { data: friends = [] } = useFriendUsersQuery(user?.uid ?? '')

  const alreadyAddedMembers = tripMembers
    .filter((m) => m.uid !== user?.uid)
    .map((m) => ({
      uid: m.uid,
      status: TripMemberStatus.Pending,
      invitedAt: Timestamp.fromDate(new Date()),
    }))

  const handleSelect = (selectedUser: User & { sendFriendRequest?: boolean }) => {
    setTripMembers([...tripMembers, selectedUser])
  }

  return (
    <AnimatedContainer key="members" animation="scaleAndFadeIn">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Anyone else coming along?</h1>
        {tripMembers.map((member) => (
          <div key={member.uid} className="rounded-lg border p-2">
            <div className="flex items-center justify-between gap-2">
              <UserMediaObject user={member} />
              <div className="flex items-center gap-2">
                {member.uid && member.sendFriendRequest && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline">
                        <UserPlus /> Friend Request
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      A friend request will be sent upon trip creation
                    </TooltipContent>
                  </Tooltip>
                )}
                <TripPartyMemberBadge
                  member={{
                    invitedAt: Timestamp.fromDate(new Date()),
                    status:
                      member.uid === user?.uid ? TripMemberStatus.Owner : TripMemberStatus.Pending,
                    uid: member.uid,
                  }}
                />
                {member.uid !== user?.uid && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTripMembers(tripMembers.filter((m) => m.uid !== member.uid))}
                  >
                    <X />
                    <span className="sr-only">Remove {member.displayName}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        <UserSearchCombobox
          onSelect={handleSelect}
          excludeUids={user?.uid ? [user.uid] : []}
          alreadyAddedMembers={alreadyAddedMembers}
          friends={friends}
          currentUserUid={user?.uid ?? ''}
        />
      </div>
    </AnimatedContainer>
  )
}

export default MembersStep
