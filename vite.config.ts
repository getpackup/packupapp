import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import netlifyReactRouter from '@netlify/vite-plugin-react-router'
import netlify from '@netlify/vite-plugin'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  define: {
    'import.meta.env.VITE_COMMIT_REF': JSON.stringify(process.env.COMMIT_REF ?? ''),
  },
  server: {
    open: false,
  },
  optimizeDeps: {
    // CJS-only dep; react-router uses named imports — prebundle for ESM interop in dev.
    include: ['cookie'],
  },
  ssr: {
    noExternal: ['use-sound'],
    optimizeDeps: {
      include: ['cookie'],
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    netlifyReactRouter(),
    netlify(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./build/client/**/*.map', './build/server/**/*.map'],
      },
      telemetry: false,
      silent: !process.env.CI,
    }),
    {
      name: 'ignore-chrome-devtools-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req?.url?.startsWith('/.well-known/appspecific/com.chrome.devtools.json')) {
            res.statusCode = 404
            return res.end()
          }
          next()
        })
      },
    },
  ],
})
