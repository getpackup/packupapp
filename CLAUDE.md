# CLAUDE.md

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
- Uses compound component patterns (Trip details + sidebar)

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

## Agent skills

### Issue tracker

Issues live in GitHub Issues for getpackup/packupapp (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.