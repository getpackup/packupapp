import { zodResolver } from '@hookform/resolvers/zod'
import { DialogDescription } from '@radix-ui/react-dialog'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFetcher } from 'react-router'
import * as z from 'zod'

import { useAuth } from '~/contexts/auth/useAuth'
import { useHelpModalState } from '~/contexts/globalState'
import { useIsAnonymous } from '~/lib/useIsAnonymous'

import { Button } from './ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Textarea } from './ui/textarea'

const helpSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  email: z
    .union([z.string().email('Please enter a valid email address'), z.literal('')])
    .optional(),
})

type HelpFormValues = z.infer<typeof helpSchema>

const inputClassName =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none'

export function HelpModal() {
  const { isHelpOpen, setIsHelpOpen } = useHelpModalState()
  const { user } = useAuth()
  const isAnonymous = useIsAnonymous()
  const fetcher = useFetcher()

  const form = useForm<HelpFormValues>({
    resolver: zodResolver(helpSchema),
    defaultValues: { message: '', email: '' },
    mode: 'onSubmit',
  })

  const isSubmitting = fetcher.state !== 'idle'
  const isSuccess = fetcher.data?.success === true

  useEffect(() => {
    if (!isHelpOpen) {
      form.reset()
    }
  }, [isHelpOpen, form])

  const onSubmit = (data: HelpFormValues) => {
    const formData = new FormData()
    formData.set('message', data.message)
    formData.set('isAnonymous', String(isAnonymous))
    if (user?.uid) formData.set('userId', user.uid)
    if (isAnonymous && data.email) formData.set('email', data.email)
    if (!isAnonymous && user) {
      if (user.displayName) formData.set('userDisplayName', user.displayName)
      if (user.username) formData.set('userUsername', user.username)
      if (user.email) formData.set('userEmail', user.email)
    }
    formData.set('url', window.location.href)
    fetcher.submit(formData, { method: 'POST', action: '/resource/send-help' })
  }

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <DialogContent showCloseButton={!isSuccess} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Help / Support</DialogTitle>
          <DialogDescription>
            Sorry to hear you are having trouble. Please describe your issue below. We will review
            your message and follow up if necessary.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col gap-4">
            <p>Thanks for reaching out! We'll get back to you as soon as we can.</p>
            <p className="text-muted-foreground text-sm">
              We will review your message and follow up if necessary.
            </p>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What do you need help with?"
                        rows={4}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAnonymous && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <input
                          type="email"
                          {...field}
                          placeholder="Email (optional)"
                          className={inputClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
