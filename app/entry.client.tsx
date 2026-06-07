import * as Sentry from '@sentry/react-router'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  release: import.meta.env.VITE_COMMIT_REF,
  environment: 'production',
  integrations: [Sentry.reactRouterTracingIntegration()],
})

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  )
})
