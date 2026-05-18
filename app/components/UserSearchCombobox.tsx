import { Plus } from 'lucide-react'
import { useState } from 'react'

import { useFriendSearch } from '../services/useFriendSearch'
import type { TripMember } from '../types/TripMember'
import type { User } from '../types/User'
import TripPartyMemberBadge from './Trip/TripPartyMemberBadge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import UserMediaObject from './UserMediaObject'

type UserSearchComboboxProps = {
  onSelect: (user: User & { sendFriendRequest?: boolean }) => void
  excludeUids: string[]
  alreadyAddedMembers: TripMember[]
  friends: User[]
  currentUserUid: string
}

export function UserSearchCombobox({
  onSelect,
  excludeUids,
  alreadyAddedMembers,
  friends,
  currentUserUid,
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [friendRequestFor, setFriendRequestFor] = useState<Record<string, boolean>>({})

  const { friendHits, allUserHits } = useFriendSearch({
    query,
    friends,
    currentUserUid,
  })

  const filteredFriendHits = friendHits.filter((u) => !excludeUids.includes(u.uid))
  const filteredAllUserHits = allUserHits.filter((u) => !excludeUids.includes(u.uid))

  const friendUids = new Set(friends.map((f) => f.uid))
  const memberUids = new Set(alreadyAddedMembers.map((m) => m.uid))

  const showFriendsSection =
    isOpen && (filteredFriendHits.length > 0 || (friends.length === 0 && query.length < 2))
  const showNoFriendsHint =
    isOpen && friends.length === 0 && filteredFriendHits.length === 0 && query.length < 2
  const showAllUsersSection = isOpen && query.length >= 1

  const handleSelect = (user: User & { sendFriendRequest?: boolean }) => {
    const sendFriendRequest = friendRequestFor[user.uid] ?? false
    onSelect({ ...user, sendFriendRequest })
  }

  const getMemberForUid = (uid: string): TripMember | undefined =>
    alreadyAddedMembers.find((m) => m.uid === uid)

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="user-search">Search Users</Label>
      <Input
        id="user-search"
        placeholder="Search by username, email, or name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="bg-card max-h-100 space-y-3 overflow-y-auto rounded border p-3">
          {showFriendsSection && (
            <div className="space-y-1">
              <p className="mb-1 text-sm font-bold tracking-wider uppercase">Friends</p>
              {showNoFriendsHint ? (
                <p className="text-muted-foreground px-2 py-1 text-sm">No friends yet</p>
              ) : (
                <div className="divide-border divide-y">
                  {filteredFriendHits.map((user) => {
                    const member = getMemberForUid(user.uid)
                    return (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between gap-2 rounded-lg py-3"
                      >
                        <UserMediaObject user={user} />
                        {member ? (
                          <TripPartyMemberBadge member={member} />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Add to trip"
                                onClick={() => handleSelect(user)}
                              >
                                <Plus />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add to trip</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {showAllUsersSection && (
            <div className="space-y-1">
              <p className="mb-1 text-sm font-bold tracking-wider uppercase">All Users</p>
              <div className="divide-border divide-y">
                {filteredAllUserHits.length > 0 &&
                  filteredAllUserHits.map((user) => {
                    const member = getMemberForUid(user.uid)
                    const isFriend = friendUids.has(user.uid)
                    const isMember = memberUids.has(user.uid)
                    return (
                      <div key={user.uid}>
                        <div className="flex items-center justify-between gap-2 rounded-lg py-3">
                          <UserMediaObject user={user} />
                          {member ? (
                            <TripPartyMemberBadge member={member} />
                          ) : (
                            <div className="flex">
                              {!isFriend && !isMember && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <label className="text-muted-foreground flex items-center gap-2 px-3 py-1 text-xs">
                                      <Checkbox
                                        checked={friendRequestFor[user.uid] ?? false}
                                        onCheckedChange={(checked) =>
                                          setFriendRequestFor((prev) => ({
                                            ...prev,
                                            [user.uid]: !!checked,
                                          }))
                                        }
                                      />
                                      Add as friend
                                    </label>
                                  </TooltipTrigger>
                                  <TooltipContent>Sends a friend request if checked</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Add to trip"
                                    onClick={() => handleSelect(user)}
                                  >
                                    <Plus />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add to trip</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                {filteredAllUserHits.length === 0 && (
                  <div className="flex flex-col gap-4 text-center">
                    <p className="text-muted-foreground px-2 py-1 text-sm">
                      No results found for <strong className="font-bold">{query}</strong>.{' '}
                    </p>
                    <p>
                      <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                        Clear search
                      </Button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
