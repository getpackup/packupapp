import { MessageCircleIcon } from 'lucide-react'

import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  userMap: Map<string, User>
  setReplyToMessageId: (messageId: string) => void
}

export default function MessageList({
  messages,
  currentUserId,
  userMap,
  setReplyToMessageId,
}: MessageListProps) {
  const messagesContentAndIds = messages.map((message) => ({
    id: message.id,
    content: message.content,
  }))
  return (
    <div className="flex h-full flex-col gap-4">
      {(messages?.length ?? 0 > 0) ? (
        messages.map((message) => {
          const user = userMap.get(message.userId)!
          const isCurrentUser = message.userId === currentUserId

          return (
            <MessageBubble
              key={message.id}
              message={message}
              user={user}
              userMap={userMap}
              isCurrentUser={isCurrentUser}
              setReplyToMessageId={setReplyToMessageId}
              replyToMessageContent={
                messagesContentAndIds.find((m) => m.id === message.replyToMessageId)?.content ??
                null
              }
            />
          )
        })
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Start the conversation</EmptyTitle>
            <EmptyDescription>Be the first to add a message</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
