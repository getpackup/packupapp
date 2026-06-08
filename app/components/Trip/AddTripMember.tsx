import { useQueries } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useFetcher, useParams } from 'react-router'
import { toast } from 'sonner'

import { useAuth } from '~/contexts/auth/useAuth'
import { createSystemMessage } from '~/lib/chat'
import { formattedDateRange } from '~/lib/date'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { usePlan } from '~/lib/usePlan'
import { useCreateChatMessage } from '~/services/chat'
import { useFriendsQuery, useSendFriendRequest } from '~/services/friends'
import { useUpdateTrip } from '~/services/trips'
import { fetchUserById, userKeys } from '~/services/users'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { PlanGate } from '../PlanGate'
import ResponsiveDialogContainer from '../ResponsiveDialogContainer'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { UpgradeAccountGate } from '../UpgradeAccountGate'
import { UserSearchCombobox } from '../UserSearchCombobox'

export function AddTripMember({ trip, tripMembers }: { trip: Trip; tripMembers: TripMember[] }) {
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateTrip } = useUpdateTrip(trip.tripId)
  const { mutateAsync: sendMessage } = useCreateChatMessage()
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const { id } = useParams()
  const fetcher = useFetcher()

  const { isFree } = usePlan()

  const activeMemberCount = tripMembers.filter(
    (m) =>
      m.status !== TripMemberStatus.Declined &&
      m.status !== TripMemberStatus.Removed &&
      m.status !== TripMemberStatus.Left
  ).length
  const atMemberCap = isFree && activeMemberCount >= 3

  const { data: friendships = [] } = useFriendsQuery(user?.uid ?? '')
  const { mutateAsync: sendFriendReq } = useSendFriendRequest()

  const friendUids = friendships
    .map((f) => f.uids.find((uid) => uid !== user?.uid) ?? '')
    .filter(Boolean)

  const friendUserQueries = useQueries({
    queries: friendUids.map((uid) => ({
      queryKey: userKeys.byId(uid),
      queryFn: () => fetchUserById(uid),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const friends = friendUserQueries.map((q) => q.data).filter((u): u is User => u != null)

  const handleSelect = async (selectedUser: User & { sendFriendRequest?: boolean }) => {
    if (!user || !id) return

    const payload = {
      [`tripMembers.${selectedUser.uid}`]: {
        uid: selectedUser.uid,
        invitedAt: new Date(),
        status: TripMemberStatus.Pending,
        invitedBy: user.uid,
      },
    }

    try {
      await updateTrip({ data: payload })

      const newMessage = createSystemMessage(
        `@${user.username.toLowerCase()} has invited @${selectedUser.username.toLowerCase()} to the trip.`
      )
      await sendMessage({ tripId: trip.tripId, data: newMessage })

      fetcher.submit(
        {
          invitedBy: user.username,
          inviterUid: user.uid,
          inviteeUid: selectedUser.uid,
          tripId: trip.tripId,
          isFriend: String(friendUids.includes(selectedUser.uid)),
          email: selectedUser.email,
          greetingName: selectedUser.username || '',
          tripName: trip.name,
          where: trip.startingPoint,
          why: trip.description,
          when: formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000),
          tags: trip.tags,
        },
        {
          method: 'POST',
          action: '/resource/send-trip-invitation',
        }
      )

      toast.success(`${selectedUser.username} has been invited to the trip`)

      if (selectedUser.sendFriendRequest && user.uid) {
        try {
          await sendFriendReq({ senderUid: user.uid, recipientUid: selectedUser.uid })
          const formData = new FormData()
          formData.append('recipientEmail', selectedUser.email)
          formData.append('recipientUid', selectedUser.uid)
          formData.append('requesterUid', user.uid)
          formData.append('requesterDisplayName', user.displayName ?? '')
          formData.append('requesterUsername', user.username)
          fetch('/resource/send-friend-request', { method: 'POST', body: formData }).catch(() => {})
        } catch {
          // Friend request is independent — don't block the trip invite
        }
      }
    } catch (error) {
      toast.error('Error adding member to trip: ' + (error as Error).message)
    }
  }

  const triggerButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          <span className="sr-only">Add member</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add Trip Member</TooltipContent>
    </Tooltip>
  )

  const trigger = atMemberCap ? (
    <PlanGate feature="Unlimited trip members">{triggerButton}</PlanGate>
  ) : (
    triggerButton
  )

  if (isAnonymous) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger}
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Create an account</DialogTitle>
          <UpgradeAccountGate message="Create an account to invite friends and assign gear to your crew.">
            <div />
          </UpgradeAccountGate>
        </DialogContent>
      </Dialog>
    )
  }

  const content = (
    <UserSearchCombobox
      onSelect={handleSelect}
      excludeUids={[user?.uid ?? '']}
      alreadyAddedMembers={tripMembers}
      friends={friends}
      currentUserUid={user?.uid ?? ''}
    />
  )

  return (
    <>
      {trigger}
      <ResponsiveDialogContainer
        open={open}
        onOpenChange={setOpen}
        title="Add Trip Member"
        description="Search for friends to invite to your trip."
        contentProps={{ 'aria-describedby': undefined }}
      >
        {content}
      </ResponsiveDialogContainer>
    </>
  )
}
