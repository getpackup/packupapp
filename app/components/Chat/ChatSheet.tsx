import { formatDistanceToNow, isAfter, subSeconds } from 'date-fns'
import { orderBy } from 'firebase/firestore'
import { Dot, MessageCircleIcon, Reply, UserPlus, XIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import useAuth from '~/contexts/auth/useAuth'
import { createChatMessage } from '~/lib/chat'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { cn } from '~/lib/utils'
import {
  useCreateChatMessage,
  useMarkChatRead,
  useTripChatMessagesQuery,
  useTripChatReadStatusQuery,
  useUpdateTypingStatus,
} from '~/services/trips'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import ChatContainer from './ChatContainer'
import MessageInput from './MessageInput'

type ChatSheetProps = {
  trip: Trip
  users: User[]
  compact?: boolean
  defaultOpen?: boolean
}

const systemUser: User = {
  id: 'system',
  username: 'Packup Yak',
  photoURL: '/icons/icon-192x192.png',
  email: 'hello@getpackup.com',
  displayName: 'Packup Yak',
  uid: 'system',
}

function ChatSheet({ trip, users, compact, defaultOpen }: ChatSheetProps) {
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const [userMap] = useState<Map<string, User>>(
    new Map([...(users || []).map((u): [string, User] => [u.id, u]), [systemUser.id, systemUser]])
  )
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)

  const constraints = useMemo(() => [orderBy('createdAt', 'asc')], [])

  const { data: messages } = useTripChatMessagesQuery({
    tripId: trip.tripId,
    constraints,
    queryOptions: {
      enabled: !!trip?.tripId && trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    },
  })

  const { data: typingStatuses } = useTripChatReadStatusQuery({
    tripId: trip.tripId,
  })

  const { mutateAsync: sendMessage } = useCreateChatMessage()

  const { mutateAsync: updateTypingStatus } = useUpdateTypingStatus(trip.tripId, user?.uid)

  const { mutateAsync: markChatRead } = useMarkChatRead(user?.uid)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open || isAnonymous || !user?.uid) return
      const lastMessageId = messages?.[messages.length - 1]?.id ?? ''
      markChatRead({ tripId: trip.tripId, lastReadMessageId: lastMessageId })
    },
    [isAnonymous, user?.uid, messages, markChatRead, trip.tripId]
  )

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!user?.uid || !user?.username) return

      await updateTypingStatus({ isTyping: false })

      const newMessage = createChatMessage(
        user.uid,
        user.username,
        text.trim(),
        user.photoURL ?? undefined,
        replyToMessageId ?? undefined
      )
      await sendMessage({ tripId: trip.tripId, data: newMessage })
      setReplyToMessageId(null)
    },
    [
      user?.uid,
      user?.username,
      user?.photoURL,
      replyToMessageId,
      updateTypingStatus,
      sendMessage,
      trip.tripId,
    ]
  )

  const handleTypingChange = useCallback(
    async (isTyping: boolean) => {
      await updateTypingStatus({ isTyping })
    },
    [updateTypingStatus]
  )

  // Determine who is typing (excluding current user and expired statuses)
  const typingUsers = useMemo(() => {
    if (!typingStatuses || !user?.uid) return []

    const now = new Date()
    const fiveSecondsAgo = subSeconds(now, 5)

    const activeTypingUsers: string[] = []

    for (const status of typingStatuses) {
      // Skip current user
      if (status.userId === user.uid) continue

      // Check if user has typingStartedAt and it's recent (within 5 seconds)
      if (status.typingStartedAt) {
        const typingStartTime = status.typingStartedAt.toDate()
        if (isAfter(typingStartTime, fiveSecondsAgo)) {
          activeTypingUsers.push(status.userId)
        }
      }
    }

    return activeTypingUsers
  }, [typingStatuses, user?.uid])

  // Format typing message based on number of users
  const typingMessage = useMemo(() => {
    if (typingUsers.length === 0) return null

    const typingUsernames = typingUsers
      .map((userId) => userMap.get(userId)?.username)
      .filter((username): username is string => !!username)

    if (typingUsernames.length === 0) return null

    if (typingUsernames.length === 1) {
      return (
        <>
          <span className="font-bold">@{typingUsernames[0]}</span> is typing
        </>
      )
    } else if (typingUsernames.length === 2) {
      return (
        <>
          <span className="font-bold">@{typingUsernames[0]}</span> and{' '}
          <span className="font-bold">@{typingUsernames[1]}</span> are typing
        </>
      )
    } else {
      return (
        <>
          <span className="font-bold">Several people</span> are typing
        </>
      )
    }
  }, [typingUsers, userMap])

  const replyToMessageContent =
    useMemo(() => {
      return messages?.find((message) => message.id === replyToMessageId)?.content ?? null
    }, [messages, replyToMessageId]) ?? null

  return (
    <Sheet defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon">
            <MessageCircleIcon className="size-5" />
            <span className="sr-only">Trip Chat</span>
          </Button>
        ) : (
          <Button variant="accent" size="lg" className="shadow-2xl">
            <MessageCircleIcon className="size-4" />
            Trip Chat
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Trip Chat</SheetTitle>
          <SheetDescription>
            {(messages?.length ?? 0 > 0)
              ? `Last message sent 
            ${formatDistanceToNow(
              messages?.[messages.length - 1]?.createdAt.toDate() ?? new Date(),
              { addSuffix: true }
            )}`
              : `Planning and discussion for ${trip.name}`}
          </SheetDescription>
        </SheetHeader>
        {isAnonymous ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <UserPlus className="text-muted-foreground size-8" />
            <p className="text-muted-foreground">
              Create an account to chat with trip members
            </p>
            <Button variant="accent" asChild>
              <Link to="/signup">
                <UserPlus className="size-4" />
                Create Account
              </Link>
            </Button>
          </div>
        ) : (
          <>
        <ChatContainer
          messages={messages ?? []}
          currentUserId={user?.uid ?? ''}
          userMap={userMap}
          setReplyToMessageId={setReplyToMessageId}
        />
        <SheetFooter className="border-t">
          <div>
            <div
              className={cn(
                'grid w-full overflow-hidden transition-all duration-300 ease-in-out',
                replyToMessageContent ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              {replyToMessageContent && (
                <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-sm">
                  <div className="flex max-w-72 items-center gap-1">
                    <Reply className="text-muted-foreground size-3 shrink-0 scale-x-[-1]" />
                    <div className="min-w-0 truncate">
                      <span className="font-bold">Replying to:</span> {replyToMessageContent}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setReplyToMessageId(null)}>
                    <XIcon className="size-4" />
                  </Button>
                </div>
              )}
            </div>
            <div
              className={cn(
                'grid overflow-hidden transition-all duration-300 ease-in-out',
                typingMessage ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="min-h-0">
                {typingMessage && (
                  <div className="flex items-center gap-2 pb-2">
                    <div className="flex -space-x-2.5">
                      <Dot className="animate-typing-dot-bounce size-4" />
                      <Dot className="animate-typing-dot-bounce size-4 [animation-delay:90ms]" />
                      <Dot className="animate-typing-dot-bounce size-4 [animation-delay:180ms]" />
                    </div>
                    <p className="text-muted-foreground text-xs">{typingMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <MessageInput
              onSendMessage={handleSendMessage}
              replyToMessageId={replyToMessageId}
              onTypingChange={handleTypingChange}
            />
          </div>
        </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default ChatSheet
