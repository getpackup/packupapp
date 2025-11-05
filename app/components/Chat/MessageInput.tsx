import { Send } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/ui/button'

import { Textarea } from '../ui/textarea'

interface MessageInputProps {
  onSendMessage: (text: string) => void
  replyToMessageId: string | null
}

export default function MessageInput({ onSendMessage, replyToMessageId }: MessageInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (replyToMessageId) {
      inputRef.current?.focus()
    }
  }, [replyToMessageId])

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text)
      setText('')
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
