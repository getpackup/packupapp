import path from 'path'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const firebasePackages = [
  'firebase/firestore',
  'firebase/auth',
  'firebase/storage',
  'firebase/messaging',
]

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: Object.fromEntries(
      firebasePackages.map((pkg) => [
        pkg,
        path.resolve(`node_modules/${pkg}/dist/index.cjs.js`),
      ])
    ),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/.sandcastle/**', 'functions/lib/**'],
  },
})
