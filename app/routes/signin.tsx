import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Logo } from '~/components/Logo'
import { firebaseAuth } from '~/firebase/config'

export default function Signin() {
  const navigate = useNavigate()

  const [isSigningInWithEmail, setIsSigningInWithEmail] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const isSignInWithEmailLinkValid = isSignInWithEmailLink(firebaseAuth, window.location.href)

    if (isSignInWithEmailLinkValid) {
      setIsSigningInWithEmail(true)
    }
  }, [isClient, firebaseAuth])

  useEffect(() => {
    if (!isSigningInWithEmail || !isClient) return

    let email = window.localStorage.getItem('emailForSignIn')
    if (!email) {
      // User opened the link on a different device. To prevent session fixation
      // attacks, ask the user to provide the associated email again. For example:
      email = window.prompt('Please provide your email for confirmation')
    }
    // The client SDK will parse the code from the link for you.
    if (email) {
      signInWithEmailLink(firebaseAuth, email, window.location.href)
        .then((result) => {
          // if (client.location) {
          //   trackEvent('User Logged In and Needed Redirection', {
          //     location: client.location,
          //     email: result.user?.email,
          //   })
          //   dispatch(removeAttemptedPrivatePage())
          //   router.push(client.location)
          // } else {
          //   trackEvent('User Logged In', {
          //     email: result.user?.email,
          //   })
          //   router.push('/')
          // }
          navigate('/trips')
        })
        .catch((error) => {
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
          // trackEvent('User Log In Failure from signInWithEmailLink', {
          //   error,
          //   email,
          // })

          if (error) {
            console.error(error)
            navigate(`/signup?email=${encodeURIComponent(email)}`)
            if (error.code === 'auth/invalid-action-code') {
              toast.error(
                `That looks like an old link you tried to sign in with. Please check your email for the latest link we sent.`,
                {
                  icon: <TriangleAlert />,
                  duration: 10000000,
                }
              )
            } else {
              toast(`Looks like you don't have an account yet. Let's get you signed up!`, {
                icon: '👋',
              })
            }
          } else {
            toast.error('Unable to log in with those credentials. Please try again.')
          }
        })
    }
  }, [isSigningInWithEmail, isClient, firebaseAuth, navigate])

  return (
    <div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center space-y-8 px-8">
        <Logo />
        <h1 className="text-2xl font-bold">Welcome to Packup</h1>
        <div className="space-y-4 rounded border bg-gray-100/50 p-8 text-center dark:bg-gray-800">
          <p className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />{' '}
            {isClient ? 'Signing you in...' : 'Loading...'}
          </p>

          <p className="text-muted-foreground text-sm">
            If this takes longer than 30 seconds, please check your email for the latest link we
            sent.
          </p>
        </div>
      </div>
    </div>
  )
}
