import { zodResolver } from '@hookform/resolvers/zod'
import {
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  type UserCredential,
} from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { BadgeCheck, ChevronLeft, ChevronRight, Loader2, Mail, UserPlus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { type MouseEventHandler } from 'react'
import { useForm } from 'react-hook-form'
import { animated } from 'react-spring'
import { toast } from 'sonner'
import { z } from 'zod'

import { firebaseAuth } from '~/firebase/config'
import { generatePassword } from '~/lib/generatePassword'
import useBoop from '~/lib/useBoop'
import { cn } from '~/lib/utils'
import { useCreateUser } from '~/services/api'

import { Button } from './ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { Progress } from './ui/progress'

export function SignupForm() {
  const [style, trigger] = useBoop({ scale: 1.1 })
  const [backStyle, triggerBack] = useBoop({ x: -2 })
  const [nextStyle, triggerNext] = useBoop({ x: 2 })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  )
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [algoliaService, setAlgoliaService] = useState<any>(null)
  const [formStep, setFormStep] = useState<'email' | 'displayName' | 'username'>('email')

  const { mutateAsync: createUserAsync } = useCreateUser()

  const formSchema = z.object({
    email: z.email(),
    displayName: z.string().min(3, { message: 'Full name must be at least 3 characters' }).max(100),
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(30, { message: 'Username must be less than 30 characters' })
      .regex(/^[a-zA-Z0-9]+$/, { message: 'Username can only contain letters and numbers' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      displayName: '',
      username: '',
    },
  })

  // Load Algolia service only on client side
  useEffect(() => {
    const loadAlgoliaService = async () => {
      try {
        const { algoliaSearch } = await import('~/services/algoliaSearch')
        setAlgoliaService(algoliaSearch)
      } catch (error) {
        console.error('Failed to load Algolia service:', error)
      }
    }

    if (isHydrated) {
      loadAlgoliaService()
    }
  }, [isHydrated])

  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      if (!isHydrated || !algoliaService) return

      if (username.length < 3) {
        setUsernameStatus('idle')
        return
      }

      setUsernameStatus('checking')

      try {
        const response = await algoliaService.search([
          {
            indexName: 'Users',
            query: username,
          },
        ])

        const result = response.results[0]
        const firstResult = result.hits[0]
        const firstResultUsername = firstResult?.username?.toLowerCase()

        const isAvailable = !result || firstResultUsername !== username
        setUsernameStatus(isAvailable ? 'available' : 'taken')

        if (!isAvailable) {
          form.setError('username', {
            message: 'Username is already taken',
          })
        } else {
          form.clearErrors('username')
        }
      } catch (error) {
        console.error('Error checking username:', error)
        setUsernameStatus('idle')
      }
    },
    [isHydrated, algoliaService, form]
  )

  const handleUsernameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isHydrated || !algoliaService) return

      const value = event.target.value.toLowerCase()

      if (usernameTimeout) {
        clearTimeout(usernameTimeout)
      }

      const timeout = setTimeout(() => {
        checkUsernameAvailability(value)
      }, 500)

      setUsernameTimeout(timeout)
    },
    [usernameTimeout, checkUsernameAvailability, isHydrated, algoliaService]
  )

  // Prevent hydration mismatch by only allowing username checking after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    return () => {
      if (usernameTimeout) {
        clearTimeout(usernameTimeout)
      }
    }
  }, [usernameTimeout])

  const createUserFromAuthResult = (
    result: UserCredential,
    username: string,
    displayName: string
  ) => {
    return createUserAsync({
      uid: result.user.uid,
      email: result.user.email!,
      displayName: displayName,
      username: username,
      photoURL: '',
      bio: '',
      website: '',
      location: '',
      lastUpdated: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
      .then(() => {
        if (result.user.email) {
          const actionCodeSettings = {
            url: `${window.location.origin}/signin`,
            handleCodeInApp: true,
          }

          // TODO:
          // trackEvent('New User Signed Up And Created Profile', {
          //   email: result.user.email,
          // })
          sendSignInLinkToEmail(firebaseAuth, result.user.email, actionCodeSettings)
        }
      })
      .catch((err) => {
        console.error('Error creating user:', err)
        // TODO:
        // trackEvent('New User Signed Up And Profile Creation Failed', {
        //   email: result.user.email,
        //   error: err,
        // })
        toast.error(err.message)
      })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    const password = await generatePassword(16)

    createUserWithEmailAndPassword(firebaseAuth, values.email, password)
      .then((result) => {
        if (result.user) {
          createUserFromAuthResult(result, values.username, values.displayName)
        }
      })
      .catch((error) => {
        toast.error('Failed to login. Please try again.')
        console.error('Login error:', error)
      })
      .finally(() => {
        setLoading(false)
        setSubmitted(true)
      })
  }

  const isIOS = /iphone|ipad/.test(navigator.userAgent.toLowerCase())
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase())

  const handleOpenInbox = () => {
    if (isIOS) {
      // iOS - opens Mail app to inbox
      window.location.href = 'message://'
    } else if (isAndroid) {
      // Android - this varies by email client
      window.location.href = 'intent:///#Intent;scheme=mailto;package=com.google.android.gm;end'
    } else {
      window.open(`mailto:${form.getValues('email')}`, '_blank')
    }
  }

  return (
    <div className="">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="submitted"
            className="flex flex-col space-y-8 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.2,
              scale: { type: 'spring', visualDuration: 0.2, bounce: 0.25 },
            }}
          >
            <h2 className="text-xl font-bold">Check your email</h2>
            <p>
              We just sent an email to <span className="italic">{form.getValues('email')}</span>.
              Tap on the link and you'll be logged in instantly.
            </p>

            <Button variant="accent" onClick={handleOpenInbox} className="w-full">
              <Mail /> Open your inbox
            </Button>

            <p className="text-muted-foreground text-sm leading-relaxed">
              If you don't see the email, check your spam folder. Wrong email?{' '}
              <span
                className="text-accent cursor-pointer hover:underline"
                onClick={() => setSubmitted(false)}
              >
                Please re-enter your email address.
              </span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.2,
              scale: { type: 'spring', visualDuration: 0.2, bounce: 0.25 },
            }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <p className="text-muted-foreground mb-2 text-center text-sm font-bold">
                    Step {formStep === 'email' ? 1 : formStep === 'displayName' ? 2 : 3} of 3
                  </p>

                  <Progress
                    value={formStep === 'email' ? 33 : formStep === 'displayName' ? 66 : 100}
                    aria-label="Signup progress"
                  />
                </div>

                <AnimatePresence mode="wait">
                  {formStep === 'email' && (
                    <motion.div
                      key="email"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="your@email.com"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  form.setValue('email', e.target.value, { shouldDirty: true })
                                  // Clear validation errors when user starts typing
                                  if (form.formState.errors.email) {
                                    form.clearErrors('email')
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="accent"
                        className="mt-4 w-full"
                        onClick={async () => {
                          const isValid = await form.trigger('email')
                          if (isValid) {
                            setFormStep('displayName')
                          }
                        }}
                        disabled={!form.watch('email') || !!form.formState.errors.email}
                        onMouseDown={triggerNext as MouseEventHandler<HTMLButtonElement>}
                      >
                        <animated.span style={nextStyle} className="flex items-center gap-1">
                          Next <ChevronRight className="size-4" />
                        </animated.span>
                      </Button>
                    </motion.div>
                  )}

                  {formStep === 'displayName' && (
                    <motion.div
                      key="displayName"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First Last"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  // Clear validation errors when user starts typing
                                  if (form.formState.errors.displayName) {
                                    form.clearErrors('displayName')
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="mt-8 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className=""
                          onClick={() => setFormStep('email')}
                          onMouseDown={triggerBack as MouseEventHandler<HTMLButtonElement>}
                        >
                          <animated.span style={backStyle} className="flex items-center gap-1">
                            <ChevronLeft className="size-4" /> Back
                          </animated.span>
                        </Button>
                        <Button
                          type="button"
                          variant="accent"
                          className="flex-1"
                          onClick={async () => {
                            const isValid = await form.trigger('displayName')
                            if (isValid) {
                              setFormStep('username')
                            }
                          }}
                          disabled={
                            !form.watch('displayName') || !!form.formState.errors.displayName
                          }
                          onMouseDown={triggerNext as MouseEventHandler<HTMLButtonElement>}
                        >
                          <animated.span style={nextStyle} className="flex items-center gap-1">
                            Next <ChevronRight className="size-4" />
                          </animated.span>
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {formStep === 'username' && (
                    <motion.div
                      key="username"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="yourusername"
                                {...field}
                                onChange={(e) => {
                                  // make sure to lowercase the value and remove special characters
                                  e.target.value = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '')
                                  field.onChange(e)
                                  handleUsernameChange(e)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            <FormDescription
                              className={cn('flex items-center gap-1 text-sm', {
                                'text-lime-700 dark:text-lime-600': usernameStatus === 'available',
                              })}
                            >
                              {usernameStatus === 'checking' && (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  Checking availability...
                                </>
                              )}
                              {usernameStatus === 'available' && (
                                <>
                                  <BadgeCheck className="size-4" />
                                  Username is available!
                                </>
                              )}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <div className="mt-8 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className=""
                          onClick={() => setFormStep('displayName')}
                          onMouseDown={triggerBack as MouseEventHandler<HTMLButtonElement>}
                        >
                          <animated.span style={backStyle} className="flex items-center gap-1">
                            <ChevronLeft className="size-4" /> Back
                          </animated.span>
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || usernameStatus !== 'available'}
                          variant="accent"
                          style={style}
                          className="flex-1"
                          onMouseOver={trigger as MouseEventHandler<HTMLButtonElement>}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="size-4 animate-spin" /> Creating...
                            </>
                          ) : (
                            <>
                              <animated.span style={style}>
                                <UserPlus />
                              </animated.span>{' '}
                              Create account
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
