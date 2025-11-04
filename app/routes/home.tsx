import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import FullPageSpinner from '~/components/FullPageSpinner'
import { LoginForm } from '~/components/LoginForm'
import { Logo } from '~/components/Logo'
import { Separator } from '~/components/ui/separator'
import { firebaseAuth } from '~/firebase/config'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign in | Packup' },
    {
      name: 'description',
      content:
        'Adventure made easy. Pack with confidence with a trip generator for any occasion, create and share collaborative packing lists, and learn from others and view the trips they packed for.',
    },
  ]
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        // Add a small delay to ensure the component has fully rendered
        setTimeout(() => {
          navigate('/trips', { replace: true })
        }, 100)
      } else {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  return (
    <div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center space-y-8 p-8">
        <Logo />
        <h1 className="text-2xl font-bold">Sign in to Packup</h1>

        <div className="w-full rounded border bg-gray-100/50 p-8 dark:bg-gray-800">
          {isLoading ? (
            <FullPageSpinner />
          ) : (
            <>
              <LoginForm />
              <Separator className="my-6" />
              <div className="space-y-2 text-center">
                <p>
                  Don't have an account yet?{' '}
                  <Link to="/signup" className="font-bold hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
