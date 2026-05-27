import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

import { useAuth } from '~/contexts/auth/useAuth'
import { useFeedbackModalState } from '~/contexts/globalState'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { cn } from '~/lib/utils'

import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

const EMOTIONS = ['😍', '👋', '😭'] as const
const CATEGORIES = ['Bug', 'Idea', 'Help', 'Other'] as const

const inputClassName =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none'

export function FeedbackModal() {
  const { isFeedbackOpen, setIsFeedbackOpen } = useFeedbackModalState()
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const fetcher = useFetcher()

  const [message, setMessage] = useState('')
  const [emotion, setEmotion] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')

  const isSubmitting = fetcher.state !== 'idle'
  const isSuccess = fetcher.data?.success === true
  const isValid = message.trim() !== '' && emotion !== '' && category !== ''

  useEffect(() => {
    if (!isFeedbackOpen) {
      setMessage('')
      setEmotion('')
      setCategory('')
      setEmail('')
    }
  }, [isFeedbackOpen])

  const handleSubmit = () => {
    const formData = new FormData()
    formData.set('message', message)
    formData.set('emotion', emotion)
    formData.set('category', category)
    formData.set('isAnonymous', String(isAnonymous))
    if (isAnonymous && email) formData.set('email', email)
    if (!isAnonymous && user) {
      if (user.displayName) formData.set('userDisplayName', user.displayName)
      if (user.username) formData.set('userUsername', user.username)
      if (user.email) formData.set('userEmail', user.email)
    }
    fetcher.submit(formData, { method: 'POST', action: '/resource/send-feedback' })
  }

  return (
    <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
      <DialogContent showCloseButton={!isSuccess}>
        <DialogHeader>
          <DialogTitle>Share Feedback</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">Thanks for your feedback! We appreciate you taking the time to share.</p>
            <Button onClick={() => setIsFeedbackOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">How are you feeling?</span>
              <div className="flex gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-label={e}
                    aria-pressed={emotion === e}
                    onClick={() => setEmotion(e)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors',
                      emotion === e
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:bg-muted'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Category</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      category === c
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-input hover:bg-muted'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {isAnonymous && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-email" className="text-sm font-medium">
                  Email <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className={inputClassName}
                />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
