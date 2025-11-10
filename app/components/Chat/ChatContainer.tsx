import { CircleArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import { Button } from '../ui/button'
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
  const lastMessageCountRef = useRef(messages.length)

  useEffect(() => {
    // instantly scroll to bottom on mount
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (shouldAutoScroll || isNearBottom) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }, 0)
      // Reset the message count when auto-scrolling
      lastMessageCountRef.current = messages.length
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    setShouldAutoScroll(isNearBottom)
    // Update the last message count when user scrolls and is near bottom
    if (isNearBottom) {
      lastMessageCountRef.current = messages.length
    }
  }

  const handleScrollToBottom = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
    setShouldAutoScroll(true)
    lastMessageCountRef.current = messages.length
  }

  const newMessageCount = messages.length - lastMessageCountRef.current
  const showNewMessagesIndicator = !shouldAutoScroll && newMessageCount > 0

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
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
      {showNewMessagesIndicator && (
        <div className="absolute right-4 bottom-4 left-4 flex justify-center">
          <span className="relative inline-flex">
            <Button
              onClick={handleScrollToBottom}
              variant="default"
              size="sm"
              className="relative rounded-full shadow-lg"
            >
              <CircleArrowDown />
              {newMessageCount === 1 ? '1 new message' : `${newMessageCount} new messages`}{' '}
            </Button>
            <span className="absolute top-0 right-1 -mt-1 -mr-1 flex size-3">
              <span className="bg-accent/80 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-accent relative inline-flex size-3 rounded-full"></span>
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
