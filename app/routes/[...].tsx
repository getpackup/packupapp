import { redirect } from 'react-router'

export async function loader() {
  return redirect('/')
}

export default function CatchAll() {
  return null
}

export function ErrorBoundary() {
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
