import { onAuthStateChanged } from 'firebase/auth'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import { LoginForm } from '~/components/LoginForm'
import { Logo } from '~/components/Logo'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { firebaseAuth } from '~/firebase/config'
import { trackPage } from '~/lib/analytics'

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
  const location = useLocation()

  useEffect(() => {
    trackPage('Log In', location.pathname, document.title)
  }, [location.pathname])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
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
            <div className="grid h-24 place-items-center">
              <div className="flex items-center gap-2">
                <Loader2 className="size-8 animate-spin" /> Loading...
              </div>
            </div>
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

        <div className="w-full text-center">
          <Button variant="outline" size="lg" asChild className="w-full">
            <Link to="/get-started">
              Try it free — no account needed
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
