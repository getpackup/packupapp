import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { firebaseAuth } from '~/firebase/config'

export default function Signin() {
  const navigate = useNavigate()

  const [isSigningInWithEmail, setIsSigningInWithEmail] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only check email link validity on the client side
  useEffect(() => {
    if (!isClient) return

    const isSignInWithEmailLinkValid = isSignInWithEmailLink(firebaseAuth, window.location.href)

    if (isSignInWithEmailLinkValid) {
      setIsSigningInWithEmail(true)
    }
  }, [isClient, firebaseAuth])

  useEffect(() => {
    if (!isSigningInWithEmail || !isClient) return

    // Additional state parameters can also be passed via URL.
    // This can be used to continue the user's intended action before triggering
    // the sign-in operation.
    // Get the email if available. This should be available if the user completes
    // the flow on the same device where they started it.
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
            //   if (error.code === 'auth/invalid-action-code') {
            //     toast.error(
            //       `That looks like an old link you tried to sign in with. Please check your email for the latest link we sent.`,
            //       {
            //         icon: '⏰',
            //       }
            //     )
            //   } else {
            //     toast(`Looks like you don't have an account yet. Let's get you signed up!`, {
            //         icon: '👋',
            //       })
            //   }
            // } else {
            //   toast.error('Unable to log in with those credentials. Please try again.')
          }
        })
    }
  }, [isSigningInWithEmail, isClient, firebaseAuth, navigate])

  // Show loading state while checking if we're on client side
  if (!isClient) {
    return <h1>Loading...</h1>
  }

  return <h1>Signing you in...</h1>
}
