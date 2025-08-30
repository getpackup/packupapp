import {redirect} from 'react-router'

export async function loader() {
  // Redirect unknown routes to home
  return redirect('/')
}

export default function CatchAll() {
  return null // This won't render since we're redirecting
}

export function ErrorBoundary() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600">
          The page you're looking for doesn't exist.
        </p>
        <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">
          Go Home
        </a>
      </div>
    </div>
  )
}
