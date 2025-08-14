import { zodResolver } from '@hookform/resolvers/zod'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { Loader2, Mail, WandSparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { type MouseEventHandler } from 'react'
import { useForm } from 'react-hook-form'
import { animated } from 'react-spring'
import { toast } from 'sonner'
import { z } from 'zod'

import { firebaseAuth } from '~/firebase/config'
import useBoop from '~/lib/useBoop'

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

export function Login() {
  const [style, trigger] = useBoop({ scale: 1.1, rotation: 10 })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const formSchema = z.object({
    email: z.email(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    const actionCodeSettings = {
      url: `${window.location.origin}/signin`,
      handleCodeInApp: true,
    }

    window.localStorage.setItem('emailForSignIn', values.email)

    sendSignInLinkToEmail(firebaseAuth, values.email, actionCodeSettings)
      .then(() => {
        setSent(true)
      })
      .catch((error) => {
        toast.error('Failed to login. Please try again.')
        console.error('Login error:', error)
      })
      .finally(() => {
        setLoading(false)
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
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
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
            <p>Tap on the link and you'll be logged in instantly.</p>

            <Button
              variant="accent"
              onClick={handleOpenInbox}
              className="w-full"
              onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
            >
              <animated.span style={style}>
                <Mail />
              </animated.span>{' '}
              Open your inbox
            </Button>

            <p className="text-muted-foreground text-sm leading-relaxed">
              If you don't see the email, check your spam folder. Wrong email?{' '}
              <span
                className="text-accent cursor-pointer hover:underline"
                onClick={() => setSent(false)}
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-sm">
                        We'll send you an email with a magic link that'll log you in instantly.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  variant="accent"
                  style={style}
                  className="mt-4 w-full"
                  onMouseEnter={trigger as MouseEventHandler<HTMLButtonElement>}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <animated.span style={style}>
                        <WandSparkles />
                      </animated.span>{' '}
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
