import { formatDistanceToNow } from 'date-fns'
import { orderBy } from 'firebase/firestore'
import { MessageCircleIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { useCreateSubCollectionDocument, useSubCollectionSubscription } from '~/services/api'
import type { ChatMessage } from '~/types/Chat'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import ChatContainer from './ChatContainer'
import MessageInput from './MessageInput'

type ChatSheetProps = {
  trip: Trip
  users: User[]
}

const systemUser: User = {
  id: 'system',
  username: 'Packup Yak',
  photoURL: '/icons/icon-192x192.png',
  email: 'hello@getpackup.com',
  displayName: 'Packup Yak',
  uid: 'system',
}

function ChatSheet({ trip, users }: ChatSheetProps) {
  const { user } = useAuth()
  const [userMap] = useState<Map<string, User>>(
    new Map([...(users || []).map((u): [string, User] => [u.id, u]), [systemUser.id, systemUser]])
  )
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)

  const constraints = useMemo(() => [orderBy('createdAt', 'asc')], [])

  const { data: messages } = useSubCollectionSubscription<ChatMessage[]>(
    'trips',
    'messages',
    trip.tripId,
    constraints
  )

  const { mutateAsync: sendMessage } = useCreateSubCollectionDocument<ChatMessage>(
    'trips',
    'messages'
  )

  const handleSendMessage = async (text: string) => {
    if (!user?.uid || !user?.username) return

    const newMessage = createChatMessage(
      user.uid,
      user.username,
      text.trim(),
      user.photoURL ?? undefined,
      replyToMessageId ?? undefined
    )
    await sendMessage({ parentDocId: trip.tripId, data: newMessage })
    setReplyToMessageId(null)
  }

  const replyToMessageContent =
    useMemo(() => {
      return messages?.find((message) => message.id === replyToMessageId)?.content ?? null
    }, [messages, replyToMessageId]) ?? null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="accent" size="lg" className="shadow-2xl">
          <MessageCircleIcon className="size-4" />
          Trip Chat
        </Button>
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
        <ChatContainer
          messages={messages ?? []}
          currentUserId={user?.uid ?? ''}
          userMap={userMap}
          setReplyToMessageId={setReplyToMessageId}
        />
        <SheetFooter className="border-t">
          {replyToMessageContent && (
            <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-sm">
              <div className="min-w-0 truncate">
                <span className="font-bold">Replying to:</span> {replyToMessageContent}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setReplyToMessageId(null)}>
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
          <MessageInput onSendMessage={handleSendMessage} replyToMessageId={replyToMessageId} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ChatSheet
