import { PassThrough } from 'node:stream'

import { createReadableStreamFromReadable } from '@react-router/node'
import * as Sentry from '@sentry/react-router'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  release: process.env.COMMIT_REF,
  environment: 'production',
})

export const streamTimeout = 5_000

export default Sentry.wrapSentryHandleRequest(handleRequest)

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  if (request.method.toUpperCase() === 'HEAD') {
    return Promise.resolve(
      new Response(null, { status: responseStatusCode, headers: responseHeaders })
    )
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady'

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    )

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId)
              timeoutId = undefined
              callback()
            },
          })
          const stream = createReadableStreamFromReadable(body)
          responseHeaders.set('Content-Type', 'text/html')
          pipe(body)
          resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }))
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            console.error(error)
          }
        },
      }
    )
  })
}
