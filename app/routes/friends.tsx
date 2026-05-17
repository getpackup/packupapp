import type { SearchResponse } from 'algoliasearch'
import { format } from 'date-fns'
import {
  Check,
  Clock,
  Loader2,
  Search,
  UserMinus,
  UserPlus,
  Users,
  UsersIcon,
  UserX,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty'
import { Input } from '~/components/ui/input'
import { UpgradeAccountGate } from '~/components/UpgradeAccountGate'
import UserMediaObject from '~/components/UserMediaObject'
import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import {
  THIRTY_DAYS_MS,
  useAcceptFriendRequest,
  useDeclinedFriendshipsQuery,
  useDeclineFriendRequest,
  useFriendsQuery,
  usePendingFriendRequestsQuery,
  useSendFriendRequest,
  useSentFriendRequestsQuery,
  useUnfriend,
} from '~/services/friends'
import { useUserByIdQuery } from '~/services/users'
import type { Friendship } from '~/types/Friendship'
import type { User } from '~/types/User'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Friends | Packup' }]
}

function FriendRequestCard({
  friendship,
  currentUid,
}: {
  friendship: Friendship
  currentUid: string
}) {
  const { data: requester } = useUserByIdQuery({ userId: friendship.requesterUid })
  const { mutateAsync: accept, isPending: isAccepting } = useAcceptFriendRequest(currentUid)
  const { mutateAsync: decline, isPending: isDeclining } = useDeclineFriendRequest(currentUid)

  if (!requester) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <UserMediaObject user={requester} />
      <div className="flex gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={() => accept({ friendshipId: friendship.id })}
          disabled={isAccepting || isDeclining}
        >
          {isAccepting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => decline({ friendshipId: friendship.id })}
          disabled={isAccepting || isDeclining}
        >
          {isDeclining ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          Decline
        </Button>
      </div>
    </div>
  )
}

function FriendCard({ friendship, currentUid }: { friendship: Friendship; currentUid: string }) {
  const friendUid = friendship.uids.find((uid) => uid !== currentUid) ?? ''
  const { data: friend } = useUserByIdQuery({ userId: friendUid })
  const { mutateAsync: removeFriend, isPending } = useUnfriend(currentUid)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!friend) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <UserMediaObject user={friend} />
      <div className="flex items-center gap-2">
        <div>
          <span className="text-muted-foreground text-xs font-normal">
            Friends since {format(friendship?.respondedAt?.toDate() ?? new Date(), 'MMMM dd, yyyy')}
          </span>
        </div>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserMinus className="size-4" />
              Unfriend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unfriend {friend.displayName}?</DialogTitle>
              <DialogDescription>
                This will remove {friend.displayName} from your friends list. They will not be
                notified.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={async () => {
                  await removeFriend({ friendshipId: friendship.id })
                  setConfirmOpen(false)
                }}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Unfriend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function FindFriends({
  currentUid,
  friendships,
}: {
  currentUid: string
  friendships: Friendship[]
}) {
  console.log({ friendships })
  const [searchValue, setSearchValue] = useState('')
  const [hits, setHits] = useState<SearchResponse<User>['hits']>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [algoliaService, setAlgoliaService] = useState<
    typeof import('~/services/algoliaSearch').algoliaSearch | null
  >(null)
  const { mutateAsync: sendRequest } = useSendFriendRequest()
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  useEffect(() => {
    const loadAlgolia = async () => {
      try {
        const { algoliaSearch } = await import('~/services/algoliaSearch')
        setAlgoliaService(algoliaSearch)
      } catch (error) {
        console.error('Failed to load Algolia:', error)
      }
    }
    loadAlgolia()
  }, [])

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [searchTimeout])

  const doSearch = useCallback(
    async (value: string) => {
      if (!algoliaService || value.length < 2) {
        setHits([])
        setIsSearching(false)
        return
      }
      try {
        const response = await algoliaService.search<User>([{ indexName: 'Users', query: value }])
        const result = response.results[0]
        if ('hits' in result) {
          setHits(result.hits.filter((h) => h.uid !== currentUid))
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [algoliaService, currentUid]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setSearchValue(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    if (value.length < 2) {
      setIsSearching(false)
      setHits([])
    } else {
      setIsSearching(true)
    }
    const timeout = setTimeout(() => doSearch(value), 200)
    setSearchTimeout(timeout)
  }

  const getConnectionStatus = (
    hitUid: string
  ): 'friend' | 'pending' | 'declined-cooldown' | 'none' => {
    const friendship = friendships.find((f) => f.uids.includes(hitUid))
    if (!friendship) return 'none'
    if (friendship.status === 'accepted') return 'friend'
    if (friendship.status === 'pending') return 'pending'
    if (friendship.status === 'declined' && friendship.declinedAt) {
      if (Date.now() - friendship.declinedAt.toMillis() < THIRTY_DAYS_MS) return 'declined-cooldown'
    }
    return 'none'
  }

  const handleSendRequest = async (recipientUid: string) => {
    setSendingTo(recipientUid)
    try {
      await sendRequest({ senderUid: currentUid, recipientUid })
    } finally {
      setSendingTo(null)
    }
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold">Find friends</h2>
      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by username, email, or name..."
          value={searchValue}
          onChange={handleChange}
          className="pl-9"
        />
      </div>
      {isSearching && hits.length === 0 && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Searching...
        </p>
      )}
      {!isSearching && searchValue.length >= 2 && hits.length === 0 && (
        <p className="text-muted-foreground text-sm">No results found.</p>
      )}
      <div className="space-y-2">
        {hits.map((hit) => {
          const status = getConnectionStatus(hit.uid)

          return (
            <div
              key={hit.objectID}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <UserMediaObject user={hit} />
              {status === 'friend' && (
                <Badge variant="success">
                  <Users /> Friends
                </Badge>
              )}
              {status === 'pending' && (
                <Badge variant="secondary">
                  <Clock />
                  Pending
                </Badge>
              )}
              {status === 'declined-cooldown' && (
                <Button variant="outline" size="sm" disabled>
                  <UserX className="size-4" />
                  Request Declined
                </Button>
              )}
              {status === 'none' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendRequest(hit.uid)}
                  disabled={sendingTo === hit.uid}
                >
                  {sendingTo === hit.uid ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  Send Friend Request
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Friends() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const uid = user?.uid ?? ''

  const { data: friends = [], isLoading: friendsLoading } = useFriendsQuery(uid)
  const { data: pendingRequests = [], isLoading: requestsLoading } =
    usePendingFriendRequestsQuery(uid)
  const { data: sentRequests = [], isLoading: sentRequestsLoading } =
    useSentFriendRequestsQuery(uid)
  const { data: declinedFriendships = [], isLoading: declinedLoading } =
    useDeclinedFriendshipsQuery(uid)

  const allFriendships = [...friends, ...pendingRequests, ...declinedFriendships, ...sentRequests]

  return (
    <>
      <PageHeader crumbs={[{ label: 'Friends', href: '/friends' }]} />
      <PageContent>
        {isAnonymous ? (
          <UpgradeAccountGate message="Create an account to connect with friends">
            <div />
          </UpgradeAccountGate>
        ) : (
          <div className="mx-auto max-w-2xl space-y-8">
            {requestsLoading || friendsLoading || declinedLoading || sentRequestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-lg font-bold">
                      Friend Requests{' '}
                      <Badge variant="default" className="ml-1">
                        {pendingRequests.length}
                      </Badge>
                    </h2>
                    <div className="space-y-2">
                      {pendingRequests.map((req) => (
                        <FriendRequestCard key={req.id} friendship={req} currentUid={uid} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  {friends.length === 0 && (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UsersIcon />
                        </EmptyMedia>
                        <EmptyTitle>No friends yet</EmptyTitle>
                        <EmptyDescription>
                          Use the search below to find people you know and send them a friend
                          request.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}

                  <FindFriends currentUid={uid} friendships={allFriendships} />

                  {friends.length > 0 && (
                    <>
                      <h2 className="mb-3 text-lg font-bold">
                        Friends{' '}
                        {friends.length > 0 && (
                          <span className="text-muted-foreground text-sm font-normal">
                            ({friends.length})
                          </span>
                        )}
                      </h2>
                      <div className="space-y-2">
                        {friends.map((f) => (
                          <FriendCard key={f.id} friendship={f} currentUid={uid} />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </PageContent>
    </>
  )
}
