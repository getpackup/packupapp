import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFetcher, useNavigate } from 'react-router'
import * as z from 'zod'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { useAuth } from '~/contexts/auth/useAuth'
import { firebaseAuth } from '~/firebase/config'

import type { Route } from './+types/home'

const accountDeleteFormSchema = z.object({
  message: z.string().optional(),
  'privacy-concerns': z.boolean(),
  'not-useful': z.boolean(),
  'better-alternative': z.boolean(),
  'other-reason': z.boolean(),
  confirmation: z.string().refine((value) => (value ? value.toLowerCase() === 'delete' : false), {
    message: 'You must type DELETE to confirm',
  }),
  email: z
    .union([z.string().email('Please enter a valid email address'), z.literal('')])
    .optional(),
})

type AccountDeleteFormValues = z.infer<typeof accountDeleteFormSchema>

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Delete Account | Packup' }]
}

export default function AccountDelete() {
  const { user } = useAuth()
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  const form = useForm<AccountDeleteFormValues>({
    resolver: zodResolver(accountDeleteFormSchema),
    defaultValues: { message: '', email: '', confirmation: '' },
    mode: 'onSubmit',
  })

  const isSubmitting = fetcher.state !== 'idle'
  const isSuccess = fetcher.data?.success === true

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      setCountdown(5)

      const intervalId = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)

      const timeoutId = setTimeout(() => {
        handleLogout()
      }, 5000)

      return () => {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
      }
    }
  }, [isSuccess])

  const onSubmit = (data: AccountDeleteFormValues) => {
    const formData = new FormData()
    formData.set('message', data.message ?? '')
    formData.set('privacy-concerns', String(data['privacy-concerns'] ?? false))
    formData.set('not-useful', String(data['not-useful'] ?? false))
    formData.set('better-alternative', String(data['better-alternative'] ?? false))
    formData.set('other-reason', String(data['other-reason'] ?? false))
    if (user) {
      if (user.uid) formData.set('userId', user.uid)
      if (user.displayName) formData.set('userDisplayName', user.displayName)
      if (user.username) formData.set('userUsername', user.username)
      if (user.email) formData.set('userEmail', user.email)
    }
    fetcher.submit(formData, { method: 'POST', action: '/resource/delete-account' })
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Delete Account', href: '/account-delete' },
        ]}
      />
      <PageContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="bg-card mx-auto max-w-md space-y-6 rounded-lg border p-6">
              {isSuccess ? (
                <>
                  <h2 className="mb-2 text-lg font-bold">Goodbye! We're sorry to see you go.</h2>
                  <p>
                    Your account deletion request is being processed. You will be logged out in
                    {` ${countdown} second${countdown === 1 ? '' : 's'}.`}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mb-2 text-lg font-bold">
                    What prompted you to delete your account?
                  </h2>
                  <p>
                    No hard feelings, we just want to use this feedback to improve. Select all that
                    apply.
                  </p>

                  <div className="mt-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="privacy-concerns"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                id="privacy-concerns"
                                onCheckedChange={field.onChange}
                                checked={field.value}
                              />
                            </FormControl>
                            <FormLabel htmlFor="privacy-concerns" className="font-normal">
                              Privacy concerns
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="not-useful"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                id="not-useful"
                                onCheckedChange={field.onChange}
                                checked={field.value}
                              />
                            </FormControl>
                            <FormLabel htmlFor="not-useful" className="font-normal">
                              I don't find the app useful anymore
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="better-alternative"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                id="better-alternative"
                                onCheckedChange={field.onChange}
                                checked={field.value}
                              />
                            </FormControl>
                            <FormLabel htmlFor="better-alternative" className="font-normal">
                              I found a better alternative
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="other-reason"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                id="other-reason"
                                onCheckedChange={field.onChange}
                                checked={field.value}
                              />
                            </FormControl>
                            <FormLabel htmlFor="other-reason" className="font-normal">
                              Other reason
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <FormLabel htmlFor="message">
                        Please share any additional feedback here:
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="message"
                          placeholder="Your feedback helps us improve!"
                          rows={4}
                          {...form.register('message')}
                        />
                      </FormControl>
                    </div>

                    <Separator />
                    <p>
                      Type <span className="font-bold">DELETE</span> to confirm your account
                      deletion. We will process your request within a week.
                    </p>
                    {form.watch('confirmation') && (
                      <p className="text-destructive flex items-center gap-2 font-bold">
                        <TriangleAlert className="size-4" />
                        This action cannot be undone.
                      </p>
                    )}
                    <FormField
                      control={form.control}
                      name="confirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Type DELETE to confirm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        type="submit"
                        disabled={!form.formState.isValid || isSubmitting}
                      >
                        {isSubmitting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>
        </Form>
      </PageContent>
    </>
  )
}
