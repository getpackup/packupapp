import { useQueries } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useFetcher, useParams } from 'react-router'
import { toast } from 'sonner'

import { useAuth } from '~/contexts/auth/useAuth'
import { createSystemMessage } from '~/lib/chat'
import { formattedDateRange } from '~/lib/date'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useIsMobile } from '~/lib/useIsMobile'
import { useFriendsQuery, useSendFriendRequest } from '~/services/friends'
import { useCreateChatMessage, useUpdateTrip } from '~/services/trips'
import { fetchUserById, userKeys } from '~/services/users'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { UpgradeAccountGate } from '../UpgradeAccountGate'
import { UserSearchCombobox } from '../UserSearchCombobox'

export function AddTripMember({
  trip,
  tripMembers,
}: {
  trip: Trip
  tripMembers: TripMember[]
}) {
  const { mutateAsync: updateTrip } = useUpdateTrip(trip.tripId)
  const { mutateAsync: sendMessage } = useCreateChatMessage()
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const isMobile = useIsMobile()
  const { id } = useParams()
  const fetcher = useFetcher()

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

  const handleSelect = async (selectedUser: User, options: { sendFriendRequest: boolean }) => {
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

      if (options.sendFriendRequest && user.uid) {
        try {
          await sendFriendReq({ senderUid: user.uid, recipientUid: selectedUser.uid })
          const formData = new FormData()
          formData.append('recipientEmail', selectedUser.email)
          formData.append('recipientUid', selectedUser.uid)
          formData.append('requesterDisplayName', user.displayName ?? '')
          formData.append('requesterUsername', user.username)
          fetch('/resource/send-friend-request', { method: 'POST', body: formData }).catch(
            () => {}
          )
        } catch {
          // Friend request is independent — don't block the trip invite
        }
      }
    } catch (error) {
      toast.error('Error adding member to trip: ' + (error as Error).message)
    }
  }

  const trigger = (
    <button type="button" className="p-1 opacity-80 hover:opacity-100">
      <Plus className="size-4" />
      <span className="sr-only">Add member</span>
    </button>
  )

  if (isAnonymous) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
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

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add Trip Member</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Add Trip Member</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  )
}
