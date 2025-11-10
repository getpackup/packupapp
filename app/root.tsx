import './app.css'

// import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect } from 'react'
import {
  data,
  isRouteErrorResponse,
  Links,
  type LoaderFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import { z } from 'zod'

import FullPageSpinner from '~/components/FullPageSpinner'
import { Toaster } from '~/components/ui/sonner'

import type { Route } from './+types/root'
import { TooltipProvider } from './components/ui/tooltip'
import { gdprConsent, themePreferenceCookie } from './cookies.server'
import { trackPageLeave } from './lib/analytics'
import { getBodyClassNames } from './lib/getBodyClassNames'
import { cn } from './lib/utils'

export const links: Route.LinksFunction = () => [
  // { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  // {
  //   rel: 'preconnect',
  //   href: 'https://fonts.gstatic.com',
  //   crossOrigin: 'anonymous',
  // },
]

export type RootLoaderData = {
  bodyClassNames: string
  showCookieBanner: boolean
  themePreference: string | undefined
}

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('Cookie')

  const themeCookie = (await themePreferenceCookie.parse(cookieHeader)) || {}
  const themePreference = z
    .union([z.literal('dark'), z.literal('light')])
    .optional()
    .parse(themeCookie.themePreference)

  const gdprCookie = (await gdprConsent.parse(cookieHeader)) || {}

  const bodyClassNames = getBodyClassNames(themePreference)

  return data<RootLoaderData>({
    bodyClassNames,
    showCookieBanner: !gdprCookie.gdprConsent,
    themePreference,
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
    },
  },
})

// Create a persister for localStorage
// const persister = createAsyncStoragePersister({
//   storage: typeof window !== 'undefined' ? window.localStorage : undefined,
// })

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<RootLoaderData>()

  useEffect(() => {
    // if (loaderData.showCookieBanner) return
    return trackPageLeave()
  }, [])

  const bodyClassNames = cn(
    `transition-colors duration-500 ease-in-out min-h-screen font-sans-serif min-h-screen relative`,
    loaderData?.bodyClassNames ?? 'bg-white text-gray-900'
  )

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
          rel="preload"
          href="/fonts/packup-bold-webfont.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/packup-regular-webfont.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={bodyClassNames}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
        <Toaster position="bottom-right" richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}

export function HydrateFallback() {
  return <FullPageSpinner />
}
