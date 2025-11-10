import { Send } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/ui/button'

import { Textarea } from '../ui/textarea'

interface MessageInputProps {
  onSendMessage: (text: string) => void
  replyToMessageId: string | null
  onTypingChange?: (isTyping: boolean) => void
}

export default function MessageInput({
  onSendMessage,
  replyToMessageId,
  onTypingChange,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingStateRef = useRef<boolean>(false)

  useEffect(() => {
    if (replyToMessageId) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 500)
    }
  }, [replyToMessageId])

  useEffect(() => {
    // Determine if user is typing
    const hasText = text.trim().length > 0

    // Clear all existing timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (hasText) {
      // User is typing - update status after a short debounce to avoid too many Firestore writes
      if (!lastTypingStateRef.current) {
        // State changed from not typing to typing
        debounceTimeoutRef.current = setTimeout(() => {
          lastTypingStateRef.current = true
          onTypingChange?.(true)
        }, 300) // Small delay before marking as typing
      }

      // Reset the inactivity timeout - clear typing status after 5 seconds of no changes
      typingTimeoutRef.current = setTimeout(() => {
        lastTypingStateRef.current = false
        onTypingChange?.(false)
      }, 5000)
    } else {
      // User cleared the text - stop typing immediately
      if (lastTypingStateRef.current) {
        lastTypingStateRef.current = false
        onTypingChange?.(false)
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [text, onTypingChange])

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text)
      setText('')
      onTypingChange?.(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        autoFocus
        ref={inputRef}
        className="max-h-24 min-h-8!"
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
      />
      <Button variant="accent" onClick={handleSend} disabled={!text.trim()} size="lg">
        <Send className="h-4 w-4" /> Send
      </Button>
    </div>
  )
}
