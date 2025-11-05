import { formatDistanceToNow } from 'date-fns'
import { orderBy } from 'firebase/firestore'
import { MessageCircleIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetClose,
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

function ChatSheet({ trip, users }: ChatSheetProps) {
  const { user } = useAuth()
  const [userMap] = useState<Map<string, User>>(new Map(users.map((u) => [u.id, u]) ?? []))

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
      user.photoURL ?? undefined
    )
    await sendMessage({ parentDocId: trip.tripId, data: newMessage })
  }

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
            Last message sent{' '}
            {formatDistanceToNow(
              messages?.[messages.length - 1]?.createdAt.toDate() ?? new Date(),
              { addSuffix: true }
            )}
          </SheetDescription>
        </SheetHeader>
        <ChatContainer
          messages={messages ?? []}
          currentUserId={user?.uid ?? ''}
          userMap={userMap}
        />
        <SheetFooter className="border-t">
          <MessageInput onSendMessage={handleSendMessage} />
          <SheetClose asChild>
            <Button variant="outline">Close chat</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ChatSheet
