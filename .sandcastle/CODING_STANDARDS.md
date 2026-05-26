# CODING_STANDARDS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. When reporting information to me, be extremely concise, and sacrifice grammar for the sake of concision.

## Development Commands

**Development server:** `pnpm dev` (starts at http://localhost:5173)
**Build:** `pnpm build`
**Type checking:** `pnpm typecheck` (runs React Router typegen + tsc)
**Linting:** `pnpm lint` or `pnpm lint:fix`

## Architecture Overview

This is a **React Router v7** application with server-side rendering using a full-stack architecture:

### Core Technologies
- **React Router v7** for routing and SSR
- **Firebase** (Firestore + Auth) for backend services
- **TanStack Query** for data fetching and caching
- **Zustand** for client-side state management
- **Tailwind CSS v4** + **Radix UI** for styling and components
- **TypeScript** throughout

### Project Structure
- `app/routes/` - File-based routing with React Router v7
- `app/components/` - Reusable UI components
- `app/components/ui/` - Radix UI-based design system components
- `app/types/` - TypeScript type definitions
- `app/services/` - Firebase API layer and custom hooks
- `app/contexts/` - React contexts (auth, global state)
- `app/lib/` - Utility functions and custom hooks

### Key Architectural Patterns

**Authentication Flow:**
- Uses Firebase Auth with React context
- `AuthWrapper.tsx` protects authenticated routes (trips, settings)
- Public routes: home, signin, signup
- Auth state managed via Firebase `onAuthStateChanged`

**Data Layer:**
- Custom Firebase hooks in `app/services/api.ts` wrap TanStack Query
- Main hooks: `useDocument`, `useCollection`, `useSubCollection`
- All mutations include optimistic updates
- Real-time subscriptions via `useDocumentSubscription`

**State Management:**
- **Local UI state:** Zustand (`app/contexts/globalState/`)
- **Server state:** TanStack Query with Firebase
- **Auth state:** React Context (`app/contexts/auth/`)

**Component Architecture:**
- Page components in `app/routes/`
- Feature-specific components in `app/components/Trip/`
- Design system components in `app/components/ui/`
- Uses `app/components/ResponsiveDialogContainer.tsx` for modals/drawers with breakpoint-based rendering

### Data Models
- **Trip:** Main entity with members, packing lists, location data
- **PackingListItem:** Subcollection under trips
- **User:** Firebase Auth user with additional profile data
- All use Firebase Timestamps and Firestore subcollections

### Styling Conventions
- **Tailwind CSS v4** with dark mode support
- **Radix UI** primitives for accessible components
- Theme managed via cookies and CSS classes
- Custom animations using Framer Motion
- Responsive design with mobile-first breakpoints and conditional rendering, using the `~/lib/use-screen-size` hook for JS-based breakpoint detection to match tailwind breakpoints

### Environment & Configuration
- Environment variables prefixed with `VITE_` for client-side
- Firebase config in `app/firebase/config.ts`
- React Router config in `react-router.config.ts`
- ESLint with strict TypeScript rules and import sorting

### Performance Patterns
- TanStack Query caching (5min stale, 10min gc for queries)
- Optimistic updates for all mutations
- Real-time subscriptions only where needed
- Route-based code splitting built into React Router v7

### Comments
DO NOT add comments to code explaining what the code is doing unless it is overly complex. Only add comments to help a developer understand why the code is doing what it is doing.

## Testing

**Runner:** `pnpm test` (vitest, jsdom environment, globals enabled)

### Before writing any test

Read at least two existing test files in the same directory or a sibling directory. The mocking patterns differ by context and copying them directly is faster than reasoning from scratch.

### Path aliases

Use the `~` alias for imports from `app/`, with the exception of anything used in the `functions/` directory, which should use relative imports. For example, in a test file:

```ts
import { useAuth } from '~/contexts/auth/useAuth'
```

In a file in `functions/`:

```ts
import { someUtil } from '../lib/someUtil'
```

### Firebase in tests

Firebase does not work under jsdom. Any file that imports Firebase directly or transitively will crash the test runner. **Mock at the service layer, not at the Firebase level.**

```ts
// Correct — mock the service hook, not firebase/firestore
vi.mock('~/services/trips', () => ({
  useUpdateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))
```

Never try to mock `firebase/firestore`, `firebase/auth`, or `app/firebase/config` directly.

### Required mocks for most component tests

These are almost always needed.

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

### `vi.mock` hoisting

`vi.mock()` calls are hoisted to the top of the file at compile time. Always declare them before any imports that depend on the mocked module.

### Wrap renders in MemoryRouter

Components that use any React Router hook (`useParams`, `useNavigate`, `Link`, etc.) must be wrapped:

```ts
render(<MemoryRouter><MyComponent /></MemoryRouter>)
```