# Backend Standards

## Firebase Utilities

**Client-side** (`~/firebase/config`):

- Exports: `firebaseAuth`, `firestoreDb`, `firebaseStorage`, `getFirebaseMessaging`
- Use in components and client-side hooks
- **Never** import in server-only resource routes

**Server-side** (`~/firebase/admin`):

- Exports: `getFirebaseAdmin()` — initializes and returns Firebase Admin app (singleton)
- Use in resource route actions needing the Admin SDK (e.g. `getAuth`, `getFirestore` from `firebase-admin`)
- **Never** import in client-side code

## Data Layer

Main hooks in `app/services/api.ts` (wrap TanStack Query):

| Hook                      | Purpose                           |
| ------------------------- | --------------------------------- |
| `useDocument`             | Fetch a single Firestore document |
| `useCollection`           | Fetch a Firestore collection      |
| `useSubCollection`        | Fetch a Firestore subcollection   |
| `useDocumentSubscription` | Real-time document subscription   |

All mutations include optimistic updates.

## Authentication Flow

- Firebase Auth with React context
- `AuthWrapper.tsx` protects authenticated routes (trips, settings)
- Public routes: home, signin, signup
- Auth state managed via Firebase `onAuthStateChanged`
