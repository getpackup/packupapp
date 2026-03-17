# Onboarding Refactor: Anonymous Auth → Account Upgrade

## Core Approach

**Firebase Anonymous Auth** with Firestore (not localStorage-only).

- Anonymous UID works identically to a real UID for all Firestore reads/writes
- `linkWithCredential()` on upgrade preserves the UID — zero data migration needed
- Minimal Firestore `users/{uid}` doc created on anonymous sign-in (`isAnonymous: true, username: '', displayName: ''`)

---

## Entry Point — `/get-started` Route

New public route (like `/signin` and `/signup`). Marketing CTA links here.

1. Calls `signInAnonymously(auth)`
2. Creates minimal Firestore `users/{uid}` doc with `isAnonymous: true`
3. Redirects to `/trips/new`

`AuthWrapper` behavior stays unchanged — it still redirects unauthenticated users to `/`. The anonymous sign-in logic is isolated to this one route.

---

## Feature Access Matrix

| Feature | Anonymous | Full Account | Gate Strategy |
|---------|-----------|-------------|---------------|
| Create trip | Yes | Yes | — |
| View/edit own trip | Yes | Yes | — |
| Packing list (generate, check) | Yes | Yes | — |
| Gear closet (browse master list) | Yes | Yes | — (during packing list generation) |
| Gear closet (customize) | No | Yes | "Create account to customize" |
| Shopping list | Yes | Yes | — |
| Settings (theme/sounds) | Yes | Yes | — |
| Chat | No | Yes | "Create account to chat" |
| Invite trip members | No | Yes | "Sign up to invite friends" |
| Friends | No | Yes | "Create account to connect" |
| Profile page | Upgrade CTA | Yes | Show signup form |
| Stripe/billing | No | Yes | Prompt upgrade first |
| Be findable via search | No | Yes | Automatic on upgrade |

---

## Feature-by-Feature Gotchas & Decisions

### 1. User Type & Auth System

- Add `isAnonymous?: boolean` field to `app/types/User.ts`
- AuthProvider fallback already handles empty fields (`username: ''`, `email: ''`, `displayName: ''`), but still create a minimal Firestore doc because `useUserByIdQuery` throws on missing docs (used when looking up trip members)
- Skip `analytics.identify()` for anonymous users in `authProvider.tsx` — sending empty email/username to Segment creates junk profiles. Guard with `if (!firebaseUser?.isAnonymous)`

### 2. Sidebar & Navigation (`app/components/Sidebar.tsx`)

**What breaks:**
- `displayName` renders empty
- `@username` renders as just `@`
- Avatar falls back to empty Gravatar (no email)
- Dropdown shows Profile/Settings links that aren't useful yet

**Approach:**
- Show "Guest" as displayName, hide `@username` line
- Show a default avatar icon (no Gravatar lookup)
- Replace Profile/Settings in dropdown with prominent **"Create Account"** CTA
- Keep theme/sounds settings accessible (they work without a profile)
- Keep Logout option (signs out the anonymous session)

### 3. Trip Creation & Ownership

Works as-is — `owner: user.uid` and `tripMembers[user.uid]` use the anonymous UID fine.

**Gotcha:** If anonymous user loses their session (clears browser, switches device), their trips are unrecoverable. Show a non-blocking banner: *"Sign up to save this trip and access it from any device."*

### 4. Packing List Generation

Works as-is — if no gear closet doc exists, `removals` defaults to `[]` and custom items are empty. Anonymous users get the master gear list filtered by selected activities.

### 5. Gear Closet — GATED

Gate gear closet customization as a conversion trigger. Anonymous users can browse the master gear list during packing list generation, but the `/gear-closet` route (custom items, tags, removals, categories) is gated. Show *"Create an account to build your personal gear closet"* CTA.

Avoids creating orphaned gear closet docs for users who never upgrade.

### 6. Chat — GATED

`ChatSheet.tsx` line 72 guards with `if (!user?.uid || !user?.username) return` — anonymous users (empty username) are already blocked.

Show a message in the chat sheet: *"Create an account to chat with trip members"* with a Sign Up button.

### 7. Trip Invitations / Sharing — GATED

**What breaks:**
- Anonymous users have no username/email → can't be found via Algolia search
- Invitation email subject uses `@username` — would render as `@`
- System messages: `@{username} has invited @{invitee}` — broken for anonymous inviter

Gate "Add member" UI behind full account. Show *"Sign up to invite friends to your trip"* in place of the search UI.

### 8. Friends — GATED

Anonymous users have no username or searchable profile. Gate the entire `/friends` route with a "Create an account to connect with friends" CTA.

### 9. Profile Page

For anonymous users, this becomes the **primary upgrade surface**:
- Show the upgrade/signup form directly (email → displayName → username)
- Messaging: *"Create your profile to save your trips, invite friends, and access from any device"*
- Show what they'll get: count of trips created, custom gear items, etc.

For full-account users, build out the actual profile editing UI (separate task).

### 10. Settings Page

Works as-is — theme and sounds toggles function fine.

### 11. Shopping List

Works as-is — filters by `user.uid`, which anonymous users have.

Same session-loss risk as trips — same banner suggestion.

### 12. Stripe / Billing — GATED

Gate all payment flows behind full accounts. If a paid feature is accessed, prompt upgrade first, then payment.

---

## The Upgrade Flow

### Must use `linkWithCredential()`, NOT `createUserWithEmailAndPassword()`

The current `SignupForm.tsx` uses `createUserWithEmailAndPassword()` which creates a NEW user with a different UID — orphaning all anonymous data. The upgrade flow must detect `auth.currentUser.isAnonymous` and use `linkWithCredential()` instead.

### Upgrade steps:
1. Reuse existing multi-step form (email → displayName → username)
2. Call `linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))`
3. `updateDoc` the existing `users/{uid}` doc: set `isAnonymous: false`, `email`, `displayName`, `username`
4. Index user in Algolia for searchability
5. Send email sign-in link for future logins

### Returning user signs in (not upgrading) — DATA ORPHAN RISK

If someone creates trips anonymously then signs into an existing account, the anonymous data is orphaned (different UID).

**Decision: Warn the user.** Detect that the current anonymous session has data (trips, etc.), and show: *"You have trips from this session. Create a new account to keep them, or sign in to your existing account (these trips won't transfer)."* Let the user make an informed choice without the complexity of cross-UID data merging.

---

## Abandoned Account Cleanup

Firebase Anonymous Auth creates real auth records + Firestore data that accumulates.

**90-day retention period** before cleanup:
- Use Firebase's built-in auto-delete for anonymous accounts inactive >90 days (Firebase Console → Authentication settings)
- Cloud Function triggered on auth user deletion to cascade-delete:
  - `users/{uid}` doc
  - `gear-closet/{uid}` doc + `additions` subcollection
  - Shopping list items where `userId == uid`
  - Trips where `owner == uid` AND no other non-anonymous members
  - Remove user from `tripMembers` on shared trips (edge case: anonymous user was somehow added)

---

## Firestore Security Rules

Anonymous users have a valid `auth.uid`, so existing rules (`request.auth.uid == resource.data.owner`) work. Consider rate limiting or write quotas to prevent abuse since anonymous accounts are trivially created.

---

## Conversion Triggers

Prompt sign-up at natural moments when users hit a gate:
- Trying to customize gear closet
- Trying to invite trip members
- Trying to use chat
- Trying to access friends
- Trying to access billing/paid features
- Non-blocking banner on trip view: "Sign up to save this trip across devices"

**Don't prompt:**
- During trip creation flow
- While actively packing (checking items)
- On first visit

---

## Decisions Summary

| Question | Decision |
|----------|----------|
| Gear closet | Gated behind full account (conversion trigger) |
| Data orphan on sign-in | Warn the user, let them choose |
| Entry point | New `/get-started` public route (AuthWrapper unchanged) |
| Cleanup | 90-day retention before deleting abandoned anonymous accounts |
| localStorage backup | Not needed — Firebase Anonymous Auth handles persistence |
| Chat for anonymous | Gated (username required for attribution) |
| Friends for anonymous | Gated (no searchable profile) |
| Invitations for anonymous | Gated (no username/email for search or system messages) |
