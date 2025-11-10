import { useEffect } from 'react'
import { redirect, useLocation } from 'react-router'

import { trackPage } from '~/lib/analytics'

export async function loader() {
  return redirect('/')
}

export default function CatchAll() {
  return null
}

export function ErrorBoundary() {
  const location = useLocation()

  useEffect(() => {
    trackPage('Page Not Found', location.pathname, document.title)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Page Not Found</h1>
        <p className="text-gray-600">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-4 inline-block text-blue-500 hover:underline">
          Go Home
        </a>
      </div>
    </div>
  )
}
