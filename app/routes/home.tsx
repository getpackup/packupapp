import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Login } from '~/components/login'
import { Logo } from '~/components/Logo'
import { ThemeToggle } from '~/components/ThemeToggle'
import { Button } from '~/components/ui/button'
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-center text-3xl font-bold">Loading...</h1>
      </div>
    )
  }

  return (
    <div>
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center space-y-8 px-8">
        <Logo />
        <h1 className="text-2xl font-bold">Sign in to Packup</h1>
        <div className="rounded border bg-gray-100/50 p-8 dark:bg-gray-800">
          <Login />
          <Separator className="my-6" />
          <div className="space-y-2 text-center">
            <p>
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
