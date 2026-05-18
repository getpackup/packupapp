import { Plus } from 'lucide-react'
import { useState } from 'react'

import { useFriendSearch } from '../services/useFriendSearch'
import type { TripMember } from '../types/TripMember'
import type { User } from '../types/User'

import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import TripPartyMemberBadge from './Trip/TripPartyMemberBadge'
import UserMediaObject from './UserMediaObject'

type UserSearchComboboxProps = {
  onSelect: (user: User, options: { sendFriendRequest: boolean }) => void
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

  const { friendHits, allUserHits, isLoading } = useFriendSearch({
    query,
    friends,
    currentUserUid,
  })

  const filteredFriendHits = friendHits.filter((u) => !excludeUids.includes(u.uid))
  const filteredAllUserHits = allUserHits.filter((u) => !excludeUids.includes(u.uid))

  const friendUids = new Set(friends.map((f) => f.uid))
  const memberUids = new Set(alreadyAddedMembers.map((m) => m.uid))

  const showFriendsSection = isOpen && (filteredFriendHits.length > 0 || (friends.length === 0 && query.length < 2))
  const showNoFriendsHint = isOpen && friends.length === 0 && filteredFriendHits.length === 0 && query.length < 2
  const showAllUsersSection = isOpen && query.length >= 2 && filteredAllUserHits.length > 0

  const handleSelect = (user: User) => {
    const sendFriendRequest = friendRequestFor[user.uid] ?? false
    onSelect(user, { sendFriendRequest })
  }

  const getMemberForUid = (uid: string): TripMember | undefined =>
    alreadyAddedMembers.find((m) => m.uid === uid)

  return (
    <div className="w-full space-y-2">
      <Input
        placeholder="Search by username, email, or name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="space-y-3">
          {showFriendsSection && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Friends
              </p>
              {showNoFriendsHint ? (
                <p className="text-muted-foreground px-2 py-1 text-sm">No friends yet</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {filteredFriendHits.map((user) => {
                    const member = getMemberForUid(user.uid)
                    return (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                      >
                        <UserMediaObject user={user} />
                        {member ? (
                          <TripPartyMemberBadge member={member} />
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleSelect(user)}
                          >
                            <Plus />
                            <span className="sr-only">Add {user.username}</span>
                          </Button>
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
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                All Users
              </p>
              <div className="max-h-50 space-y-1 overflow-y-auto">
                {filteredAllUserHits.map((user) => {
                  const member = getMemberForUid(user.uid)
                  const isFriend = friendUids.has(user.uid)
                  const isMember = memberUids.has(user.uid)
                  return (
                    <div key={user.uid}>
                      <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
                        <UserMediaObject user={user} />
                        {member ? (
                          <TripPartyMemberBadge member={member} />
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleSelect(user)}
                          >
                            <Plus />
                            <span className="sr-only">Add {user.username}</span>
                          </Button>
                        )}
                      </div>
                      {!isFriend && !isMember && (
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
                          Also send {user.username} a Friend Request
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
