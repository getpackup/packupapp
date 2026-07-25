# Architecture

## Core Technologies

- **React Router v7** — routing and SSR
- **Firebase** (Firestore + Auth) — backend services
- **TanStack Query** — data fetching and caching
- **Zustand** — client-side state management
- **Tailwind CSS v4** + **Radix UI** — styling and components
- **React Hook Form** + **Zod** — form management and schema validation
- **TypeScript** throughout

## Project Structure

| Path                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `app/routes/`        | File-based routing (React Router v7)    |
| `app/components/`    | Reusable UI components                  |
| `app/components/ui/` | Radix UI-based design system components |
| `app/types/`         | TypeScript type definitions             |
| `app/services/`      | Firebase API layer and custom hooks     |
| `app/contexts/`      | React contexts (auth, global state)     |
| `app/lib/`           | Utility functions and custom hooks      |

## Data Models

- **Trip** — main entity with members, packing lists, location data
- **PackingListItem** — subcollection under trips
- **User** — Firebase Auth user with additional profile data
- All use Firebase Timestamps and Firestore subcollections

## Environment & Configuration

- Client-side env vars prefixed with `VITE_`
- Firebase config: `app/firebase/config.ts`
- React Router config: `react-router.config.ts`
- ESLint with strict TypeScript rules and import sorting

## Performance Patterns

- TanStack Query caching: 5min stale, 10min gc
- Optimistic updates on all mutations
- Real-time subscriptions only where needed
- Route-based code splitting built into React Router v7
