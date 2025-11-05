import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  userMap: Map<string, User>
}

export default function MessageList({ messages, currentUserId, userMap }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const user = userMap.get(message.userId)!
        const isCurrentUser = message.userId === currentUserId

        return (
          <MessageBubble
            key={message.id}
            message={message}
            user={user}
            isCurrentUser={isCurrentUser}
          />
        )
      })}
    </div>
  )
}
