import { zodResolver } from '@hookform/resolvers/zod'
import type { SearchResponse } from 'algoliasearch'
import { Loader2, Plus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher, useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { useAuth } from '~/contexts/auth/useAuth'
import { createSystemMessage } from '~/lib/chat'
import { formattedDateRange } from '~/lib/date'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { algoliaSearch } from '~/services/algoliaSearch'
import { useFriendsQuery, usePendingFriendshipsQuery, useSendFriendRequest } from '~/services/friends'
import { useCreateChatMessage, useUpdateTrip } from '~/services/trips'
import { useUserByIdQuery } from '~/services/users'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import UserMediaObject from '../UserMediaObject'
import TripPartyMemberBadge from './TripPartyMemberBadge'

function FriendInviteRow({
  friendUid,
  tripMembers,
  isAddingMember,
  onAdd,
}: {
  friendUid: string
  tripMembers: TripMember[]
  isAddingMember: string | null
  onAdd: (uid: string, email: string, name: string) => void
}) {
  const { data: friendUser } = useUserByIdQuery({ userId: friendUid })
  const matchingMember = tripMembers.find((m) => m.uid === friendUid)

  if (!friendUser) return null

  return (
    <div className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors">
      <UserMediaObject user={friendUser} />
      {matchingMember ? (
        <TripPartyMemberBadge member={matchingMember} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAdd(friendUser.uid, friendUser.email, friendUser.username)}
          disabled={isAddingMember === friendUser.uid}
        >
          {isAddingMember === friendUser.uid ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus />
          )}
          <span className="sr-only">Add {friendUser.username} to trip</span>
        </Button>
      )}
    </div>
  )
}

export function AddTripPartyMember({
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
  const { id } = useParams()
  const fetcher = useFetcher()

  const { data: friendships = [] } = useFriendsQuery(user?.uid ?? '')
  const { data: pendingFriendships = [] } = usePendingFriendshipsQuery(user?.uid ?? '')
  const { mutateAsync: sendFriendReq } = useSendFriendRequest()
  const [sendFriendRequestFor, setSendFriendRequestFor] = useState<Record<string, boolean>>({})

  const [searchValueTimeout, setSearchValueTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingSearchResults, setIsLoadingSearchResults] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [algoliaService, setAlgoliaService] = useState<typeof algoliaSearch | null>(null)
  const [hits, setHits] = useState<SearchResponse<User>['hits']>([])
  const [isAddingMember, setIsAddingMember] = useState<string | null>(null)

  const friendUids = friendships.map((f) =>
    f.uids.find((uid) => uid !== user?.uid) ?? ''
  ).filter(Boolean)

  const pendingUids = pendingFriendships.map((f) =>
    f.uids.find((uid) => uid !== user?.uid) ?? ''
  ).filter(Boolean)

  const isFriend = (uid: string) => friendUids.includes(uid)
  const isPending = (uid: string) => pendingUids.includes(uid)

  // Prevent hydration mismatch by only allowing username checking after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    return () => {
      if (searchValueTimeout) {
        clearTimeout(searchValueTimeout)
      }
    }
  }, [searchValueTimeout])

  // Load Algolia service only on client side
  useEffect(() => {
    const loadAlgoliaService = async () => {
      try {
        const { algoliaSearch } = await import('~/services/algoliaSearch')
        setAlgoliaService(algoliaSearch)
      } catch (error) {
        console.error('Failed to load Algolia service:', error)
      }
    }

    if (isHydrated) {
      loadAlgoliaService()
    }
  }, [isHydrated])

  const findUsersBySearchValue = useCallback(
    async (searchValue: string) => {
      if (!isHydrated || !algoliaService) return

      if (searchValue.length < 2) {
        setHits([])
        setIsLoadingSearchResults(false)
        return
      }

      // Clear previous results when starting a new search
      setHits([])
      try {
        const response = await algoliaService.search<User>([
          {
            indexName: 'Users',
            query: searchValue,
          },
        ])

        const result = response.results[0]
        // Type guard to check if result is SearchResponse (has hits) not SearchForFacetValuesResponse
        if ('hits' in result) {
          const hits = result.hits

          setHits(hits)
        }
      } catch (error) {
        console.error('Error checking search value:', error)
      } finally {
        setIsLoadingSearchResults(false)
      }
    },
    [isHydrated, algoliaService]
  )

  const handleSearchValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isHydrated || !algoliaService) return

      const value = event.target.value.toLowerCase()

      if (searchValueTimeout) {
        clearTimeout(searchValueTimeout)
      }

      // If user clears the input, reset loading state
      if (value.length < 2) {
        setIsLoadingSearchResults(false)
        setHits([])
      } else {
        // Set loading state immediately when starting debounce to prevent "no results" flash
        setIsLoadingSearchResults(true)
      }

      const timeout = setTimeout(() => {
        findUsersBySearchValue(value)
      }, 200)

      setSearchValueTimeout(timeout)
    },
    [searchValueTimeout, findUsersBySearchValue, isHydrated, algoliaService]
  )

  const formSchema = z.object({
    searchValue: z
      .string()
      .min(1, { message: 'Search value must be at least 2 characters' })
      .max(30, { message: 'Search value must be less than 30 characters' })
      .regex(/^[a-zA-Z0-9]+$/, { message: 'Search value can only contain letters and numbers' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchValue: '',
    },
  })

  const sendTripMemberInvitationMessage = async (hitName: string) => {
    if (!user?.uid || !user?.username) return

    const newMessage = createSystemMessage(
      `@${user.username.toLowerCase()} has invited @${hitName.toLowerCase()} to the trip.`
    )
    await sendMessage({ tripId: trip.tripId, data: newMessage })
  }

  const addMemberToTrip = async (hitUserId: string, hitEmail: string, hitName: string) => {
    if (!user || !id || !hitUserId || !hitEmail || !hitName) return

    setIsAddingMember(hitUserId)

    const payload = {
      [`tripMembers.${hitUserId}`]: {
        uid: hitUserId,
        invitedAt: new Date(),
        status: TripMemberStatus.Pending,
        invitedBy: user.uid,
      },
    }

    try {
      await updateTrip({ data: payload })
        .then(async () => {
          await sendTripMemberInvitationMessage(hitName)

          fetcher
            .submit(
              {
                invitedBy: user.username,
                email: hitEmail,
                greetingName: hitName || '',
                tripName: trip.name,
                where: trip.startingPoint,
                why: trip.description,
                when: formattedDateRange(
                  trip.startDate.seconds * 1000,
                  trip.endDate.seconds * 1000
                ),
                tags: trip.tags,
              },
              {
                method: 'POST',
                action: '/resource/send-trip-invitation',
              }
            )
            .then(async () => {
              toast.success(`${hitName} has been invited to the trip`)
              if (sendFriendRequestFor[hitUserId] && user.uid) {
                try {
                  await sendFriendReq({ senderUid: user.uid, recipientUid: hitUserId })
                } catch {
                  // Friend request is independent — don't block the trip invite
                }
              }
            })
            .catch((err) => {
              toast.error(err.message)
            })
            .finally(() => {
              setIsAddingMember(null)
            })
        })
        .catch((err) => {
          // trackEvent(`Trip Party Member Add Failure`, {
          //   ...payload,
          // tripId: id,
          // error: err,
          // })
          toast.error(err.message)
          setIsAddingMember(null)
        })
    } catch (error) {
      toast.error('Error adding member to trip: ' + (error as Error).message)
      console.error('Error adding member to trip:', error)
      setIsAddingMember(null)
    }
  }

  if (isAnonymous) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="p-1 opacity-80 hover:opacity-100">
            <Plus className="size-4" />
            <span className="sr-only">Add member</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create an account to invite friends and assign gear to your crew.
            </DialogTitle>
            <DialogDescription>
              Keep your trips, invite friends, and access your data from any device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="accent" size="lg" asChild>
              <Link to="/signup">
                <UserPlus className="size-4" />
                Create account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Popover>
      <PopoverTrigger className="p-1 opacity-80 hover:opacity-100">
        <>
          <Plus className="size-4" />
          <span className="sr-only">Add member</span>
        </>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          {friendUids.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Friends
              </p>
              <div className="max-h-[150px] space-y-1 overflow-y-auto">
                {friendUids.map((fuid) => (
                  <FriendInviteRow
                    key={fuid}
                    friendUid={fuid}
                    tripMembers={tripMembers}
                    isAddingMember={isAddingMember}
                    onAdd={addMemberToTrip}
                  />
                ))}
              </div>
            </div>
          )}
          <Form {...form}>
            <form className="space-y-8">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="searchValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {friendUids.length > 0 ? 'Search all users' : 'Add trip party member'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Search by username, email, or name..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleSearchValueChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-center">
                        {isLoadingSearchResults && hits.length === 0 && (
                          <span>
                            <Loader2 className="mr-2 inline size-4 animate-spin" />
                            Searching...
                          </span>
                        )}
                        {!isLoadingSearchResults &&
                          form.getValues('searchValue') !== '' &&
                          form.getValues('searchValue').length >= 2 &&
                          hits &&
                          hits.length === 0 && (
                            <span>
                              No results found.{' '}
                              <span
                                className="text-primary cursor-pointer"
                                onClick={() => form.reset()}
                              >
                                Clear search
                              </span>
                            </span>
                          )}
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {hits.length > 0 &&
                    hits
                      .filter((hit) => !isPending(hit.uid))
                      .map((hit) => {
                      const matchingUser = tripMembers.find((member) => member.uid === hit.uid)
                      const hitIsFriend = isFriend(hit.uid)
                      return (
                        <div key={hit.objectID}>
                          <div className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors">
                            <UserMediaObject user={hit} />
                            {matchingUser ? (
                              <TripPartyMemberBadge member={matchingUser} />
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  addMemberToTrip(hit.uid, hit.email, hit.username)
                                }
                                disabled={isAddingMember === hit.uid}
                              >
                                {isAddingMember === hit.uid ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Plus />
                                )}
                                <span className="sr-only">Add {hit.username} to trip</span>
                              </Button>
                            )}
                          </div>
                          {!matchingUser && !hitIsFriend && (
                            <label className="text-muted-foreground flex items-center gap-2 px-3 py-1 text-xs">
                              <Checkbox
                                checked={sendFriendRequestFor[hit.uid] ?? false}
                                onCheckedChange={(checked) =>
                                  setSendFriendRequestFor((prev) => ({
                                    ...prev,
                                    [hit.uid]: !!checked,
                                  }))
                                }
                              />
                              Also send {hit.username} a Friend Request
                            </label>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
