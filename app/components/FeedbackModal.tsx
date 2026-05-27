import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useFetcher } from 'react-router'
import * as z from 'zod'

import { useAuth } from '~/contexts/auth/useAuth'
import { useFeedbackModalState } from '~/contexts/globalState'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { cn } from '~/lib/utils'

import { Button } from './ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'

const EMOTIONS = ['😍', '👋', '😭'] as const
const CATEGORIES = ['Bug', 'Idea', 'Help', 'Other'] as const

const feedbackSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  emotion: z.enum(EMOTIONS, { error: 'Please select how you are feeling' }),
  category: z.enum(CATEGORIES, { error: 'Please select a category' }),
  email: z
    .union([z.string().email('Please enter a valid email address'), z.literal('')])
    .optional(),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

const inputClassName =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none'

export function FeedbackModal() {
  const { isFeedbackOpen, setIsFeedbackOpen } = useFeedbackModalState()
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const fetcher = useFetcher()

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: '', emotion: '👋', category: 'Idea', email: '' },
    mode: 'onSubmit',
  })

  const { errors } = form.formState
  const isSubmitting = fetcher.state !== 'idle'
  const isSuccess = fetcher.data?.success === true

  useEffect(() => {
    if (!isFeedbackOpen) {
      form.reset()
    }
  }, [isFeedbackOpen, form])

  const onSubmit = (data: FeedbackFormValues) => {
    const formData = new FormData()
    formData.set('message', data.message)
    formData.set('emotion', data.emotion)
    formData.set('category', data.category)
    formData.set('isAnonymous', String(isAnonymous))
    if (isAnonymous && data.email) formData.set('email', data.email)
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
            <p>Thanks for your feedback! We appreciate you taking the time to share.</p>
            <p className="text-muted-foreground text-sm">
              We will review your feedback and get back to you if necessary.
            </p>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="feedback-message"
                {...form.register('message')}
                placeholder="What's on your mind?"
                rows={4}
                autoFocus
              />
              {errors.message && (
                <p className="text-destructive text-sm">{errors.message.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">How are you feeling?</span>
              <Controller
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <div className="flex gap-2">
                    {EMOTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        aria-label={e}
                        aria-pressed={field.value === e}
                        onClick={() => field.onChange(e)}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors',
                          field.value === e
                            ? 'border-primary bg-primary/10'
                            : 'border-input hover:bg-muted'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Category</span>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        aria-pressed={field.value === c}
                        onClick={() => field.onChange(c)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                          field.value === c
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-input hover:bg-muted'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {isAnonymous && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-email" className="text-sm font-medium">
                  Email <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  {...form.register('email')}
                  placeholder="Email (optional)"
                  className={inputClassName}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email.message}</p>
                )}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
