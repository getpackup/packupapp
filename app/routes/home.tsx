import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { Login } from '~/components/login'
import { firebaseAuth } from '~/firebase/config'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        console.log('User is authenticated, preparing to redirect to trips')
        // Add a small delay to ensure the component has fully rendered
        setTimeout(() => {
          console.log('Executing navigation to trips')
          navigate('/trips', { replace: true })
        }, 100)
      } else {
        console.log('User is not authenticated, showing login form')
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4 text-center">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center">Login</h1>
      <div className="mt-4 w-full max-w-md">
        <Login />
      </div>
    </div>
  )
}
