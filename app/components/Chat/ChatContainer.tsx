import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import MessageList from './MessageList'

interface ChatContainerProps {
  messages: ChatMessage[]
  currentUserId: string
  userMap: Map<string, User>
  setReplyToMessageId: (messageId: string) => void
}

export default function ChatContainer({
  messages,
  currentUserId,
  userMap,
  setReplyToMessageId,
}: ChatContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  useEffect(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (shouldAutoScroll || isNearBottom) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 0)
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    setShouldAutoScroll(isNearBottom)
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-x-hidden overflow-y-auto p-4"
    >
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        userMap={userMap}
        setReplyToMessageId={setReplyToMessageId}
      />
    </div>
  )
}
