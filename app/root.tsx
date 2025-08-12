import './app.css'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
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
import {z} from 'zod'

import type {Route} from './+types/root'
import {gdprConsent, themePreferenceCookie} from './cookies.server'
import {getBodyClassNames} from './lib/getBodyClassNames'
import {cn} from './lib/utils'

export const links: Route.LinksFunction = () => [
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export type RootLoaderData = {
  bodyClassNames: string
  showCookieBanner: boolean
  themePreference: string | undefined
}

export const loader: LoaderFunction = async ({request}) => {
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

const queryClient = new QueryClient()

export function Layout({children}: {children: React.ReactNode}) {
  const loaderData = useLoaderData<RootLoaderData>()

  const bodyClassNames = cn(
    `transition-colors duration-500 ease-in-out min-h-screen font-sans-serif min-h-screen grid grid-rows-[auto_1fr_auto] relative`,
    loaderData?.bodyClassNames ?? 'bg-white text-gray-900'
  )

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={bodyClassNames}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}

export function HydrateFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-4 border-t-blue-500 rounded-full animate-spin"></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
