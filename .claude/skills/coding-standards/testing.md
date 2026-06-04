# Testing Standards

## Runner

`pnpm test` — vitest, jsdom environment, globals enabled

## Before writing any test

Read at least two existing test files in the same directory or a sibling directory. Mocking patterns differ by context — copy them directly rather than reasoning from scratch.

## Path aliases

Use `~` for imports from `app/`:

```ts
import { useAuth } from '~/contexts/auth/useAuth'
```

Exception: files in `functions/` use relative imports.

## Firebase in tests

Firebase does not work under jsdom. **Mock at the service layer, not at the Firebase level.**

```ts
// Correct
vi.mock('~/services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))
```

Never mock `firebase/firestore`, `firebase/auth`, or `app/firebase/config` directly.

## Required mocks (most component tests)

```ts
vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } })),
}))

// When the component uses router hooks:
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useParams: vi.fn(() => ({ id: 'trip1' })) }
})
```

## vi.mock hoisting

`vi.mock()` calls are hoisted to the top of the file at compile time. Always declare them before any imports that depend on the mocked module.

## Wrap renders in MemoryRouter

Components using any React Router hook (`useParams`, `useNavigate`, `Link`, etc.) must be wrapped:

```ts
render(<MemoryRouter><MyComponent /></MemoryRouter>)
```
