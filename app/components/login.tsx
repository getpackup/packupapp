import { zodResolver } from '@hookform/resolvers/zod'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import { firebaseAuth } from '~/firebase/config'

import { Button } from './ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'

export function Login() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // const handleGoogleLogin = async () => {
  //   try {
  //     const provider = new GoogleAuthProvider();
  //     await signInWithPopup(firebaseAuth, provider);
  //     navigate('/dashboard');
  //   } catch (err) {
  //     setError('Failed to login. Please try again.');
  //     console.error('Login error:', err);
  //   }
  // };

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
    const actionCodeSettings = {
      url: `${window.location.origin}/signin`,
      handleCodeInApp: true,
    }

    window.localStorage.setItem('emailForSignIn', values.email)

    sendSignInLinkToEmail(firebaseAuth, values.email, actionCodeSettings).catch((error) => {
      setError('Failed to login. Please try again.')
      console.error('Login error:', error)
    })
  }

  return (
    <div className="flex flex-col items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}
