# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. When reporting information to me, be extremely concise, and sacrifice grammar for the sake of concision.

## Development Commands

- **Development server:** `pnpm dev` (starts at http://localhost:5173)
- **Build:** `pnpm build`
- **Type checking:** `pnpm typecheck` (runs React Router typegen + tsc)
- **Linting:** `pnpm lint` or `pnpm lint:fix`
- **Email preview:** `pnpm email:dev` (previews React Email templates)
- **Tests:** `pnpm test` (run once) or `pnpm test:watch` (watch mode)

## Architecture Overview

This is a **React Router v7** application with SSR using a full-stack architecture, deployed to Netlify.

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
- `app/components/ui/` - Radix UI-based design system components (33 components)
- `app/types/` - TypeScript type definitions
- `app/services/` - Firebase API layer and custom hooks
- `app/contexts/` - React contexts (auth, global state)
- `app/lib/` - Utility functions and custom hooks
- `app/emails/` - React Email templates (rendered server-side, sent via SendGrid)
- `docs/` - Feature specs and documentation

### Routes

**Public:**
- `home.tsx` - Landing page
- `signin.tsx`, `signup.tsx` - Auth pages

**Protected (require auth):**
- `trips/index.tsx` - All trips
- `trips/$id.tsx` - Single trip detail
- `trips/new.tsx` - Create trip wizard
- `profile.tsx` - User profile
- `gear-closet.tsx` - Gear management
- `shopping-list.tsx` - Shopping list
- `friends.tsx`, `feedback.tsx`, `settings.tsx`, `support.tsx`, `templates.tsx`

**Resource routes (server actions only):**
- `resource.toggle-theme.tsx` - Theme cookie action
- `resource.send-signin-email.tsx` - Magic link email via SendGrid
- `resource.send-trip-invitation.tsx` - Trip invitation email via SendGrid
- `resource.create-checkout-session.tsx` - Stripe checkout session
- `resource.create-portal-session.tsx` - Stripe billing portal
- `resource.stripe-webhook.tsx` - Stripe webhook handler (posts to Slack on completion)

### Key Architectural Patterns

**Authentication Flow:**
- Firebase Auth with React context (`app/contexts/auth/`)
- `AuthWrapper.tsx` protects authenticated routes
- Magic link sign-in via SendGrid + Firebase Admin on server
- Auth state managed via Firebase `onAuthStateChanged`

**Data Layer:**
- Custom Firebase hooks in `app/services/` wrap TanStack Query
- Main hooks: `useDocument`, `useCollection`, `useSubCollection` (in `trips.ts`)
- All mutations include optimistic updates
- Real-time subscriptions via `useDocumentSubscription`
- Services: `trips.ts`, `users.ts`, `weather.ts`, `shoppingList.ts`, `gear.ts`, `algoliaSearch.ts`, `auth.tsx`

**State Management:**
- **Server state:** TanStack Query with Firebase (5min stale, 10min gc)
- **Local UI state:** Zustand (`app/contexts/globalState/`) — persists to sessionStorage
- **Auth state:** React Context (`app/contexts/auth/`)

**Component Architecture:**
- Page components in `app/routes/`
- Feature-specific components: `app/components/Trip/`, `app/components/Chat/`, `app/components/ShoppingList/`
- Design system components in `app/components/ui/`
- Compound component patterns (Trip details + sidebar)

**Server-Side:**
- `app/cookies.server.ts` - Cookie management (theme, GDPR consent)
- Firebase Admin SDK for server-side ops (magic links, etc.)
- React Email components rendered to HTML/text server-side

### Data Models
- **Trip:** Main entity — name, description, location, dates, tags, season, members, headerImage, timezone
- **PackingListItem:** Subcollection under trips — category, quantity, weight, isPacked, isEssential, packedBy, labels
- **User:** Firebase Auth user + profile — preferences (theme, temperatureUnit, tour flags), emergencyContacts
- **GearItem:** Equipment with 47 activity type flags (hiking, camping, skiing, etc.)
- **Chat/ChatMessage:** Real-time trip chat — messages subcollection, read status, typing indicators
- **ShoppingListItem:** Priority-based items with estimated/actual price, linked to packing list items
- **ItemLabel:** Labels for packing items (id, text, color)
- All use Firebase Timestamps and Firestore subcollections

### Integrated Services
| Service | Purpose | Env vars |
|---|---|---|
| Firebase (client) | Auth + Firestore | `VITE_FIREBASE_*` |
| Firebase Admin | Server-side ops | `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Stripe | Subscriptions + billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| SendGrid | Transactional email | `SENDGRID_API_KEY` |
| Algolia | Full-text search | Algolia env vars |
| Google Maps | Location search/autocomplete | Google Maps env vars |
| Mapbox | Map rendering | Mapbox env vars |
| Open-Meteo | Weather (free, no auth) | — |
| Segment | Analytics (client + server) | Segment env vars |
| Slack | Webhook notifications (Stripe events) | `SLACK_WEBHOOK_URL` |
| Sentry | Error tracking | Sentry DSN |

### Styling Conventions
- **Tailwind CSS v4** with dark mode support
- **Radix UI** primitives for accessible components
- Theme managed via cookies and CSS classes
- Animations via `motion` package (Framer Motion v3 equivalent)
- Responsive design to support popular viewports (mobile, table, desktop and HD screens) 

### Testing
- **Stack:** Vitest + jsdom + @testing-library/jest-dom
- Test files co-located with source (e.g. `foo.test.ts` next to `foo.ts`)
- Config: `vitest.config.ts`, setup: `app/test-setup.ts`

### Comments
DO NOT add comments to code explaining what the code is doing unless it is overly complex. Only add comments to help a developer understand why the code is doing what it is doing.

### Workflow
- Revise CLAUDE.md every time a local changes are either commited or pushed to GitHub remote repository
- Don't put Claude as co-author when writing commits