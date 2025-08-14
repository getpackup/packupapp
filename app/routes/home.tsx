import { onAuthStateChanged } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Login } from '~/components/Login'
import { Logo } from '~/components/Logo'
import { ThemeToggle } from '~/components/ThemeToggle'
import { Separator } from '~/components/ui/separator'
import { firebaseAuth } from '~/firebase/config'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Log In | Packup' },
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
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center space-y-8 p-8">
        <Logo />
        <h1 className="text-2xl font-bold">Sign in to Packup</h1>

        <div className="w-full rounded border bg-gray-100/50 p-8 dark:bg-gray-800">
          {isLoading ? (
            <h1 className="text-center text-xl font-bold">
              <Loader2 className="mr-1 inline size-6 animate-spin" /> Loading...
            </h1>
          ) : (
            <>
              <Login />
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
