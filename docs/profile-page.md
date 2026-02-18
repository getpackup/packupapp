# Profile Page

## Purpose

Allow users to view and edit their personal profile information. A profile completion bar encourages them to fill in all fields.

---

## Fields

| Field | Editable | Notes |
|---|---|---|
| Display name | Yes | Existing `displayName` field on `User` |
| Username | No (display only) | Already on `User` |
| Email | No (display only) | Firebase Auth–owned |
| Bio | Yes | Existing `bio` field on `User`, free-text textarea |
| Location | Yes | Existing `location` field on `User`, Google Places autocomplete |
| Profile image | Yes | Maps to existing `photoURL` on `User` |
| Favourite activities | Yes | New field on `User`, multi-select from predefined list |
| Emergency contacts | Yes | Existing `emergencyContacts` field on `User`, list of name + email + phone |

---

## Data Model Changes

### `User` type (`app/types/User.ts`)

Add one new optional field:

```ts
favouriteActivities?: Array<keyof ActivityTypes>
```

No other changes needed. `displayName`, `location`, `bio`, and `emergencyContacts` already exist on `User`.

---

## Activity Types

Source: `gearListActivities` from `app/lib/gearListItemEnum.ts` — the 16 entries that represent real outdoor activities:

| Key | Label |
|---|---|
| `hiking` | Hiking |
| `paddling` | Paddling |
| `surfing` | Surfing |
| `fishing` | Fishing |
| `mountainBiking` | Mountain Biking |
| `bikepacking` | Bikepacking |
| `trailRunning` | Trail Running |
| `bouldering` | Bouldering |
| `sportClimbing` | Sport Climbing |
| `tradClimbing` | Trad Climbing |
| `iceClimbing` | Ice Climbing |
| `mountaineering` | Mountaineering |
| `touring` | Touring |
| `resort` | Resort |
| `crossCountrySkiing` | XC Skiing |
| `snowshoeing` | Snowshoeing |

Do **not** include accommodations, transport, or gear-filter-only types (tent, car, airplane, baby, etc.) — those live in `gearListAccommodations`, `gearListOtherConsiderations`, etc.

Display as a tag list in view mode. In edit mode, show all 16 as selectable tags (toggle on/off). Selected tags are visually distinct (filled/coloured vs outlined).

---

## Location

Single text field with Google Places autocomplete. The full suggestion description (e.g. `"Vancouver, BC, Canada"`) is written directly to the existing `location` field on `User`.

### Implementation

Use `useGooglePlaces` as-is. On suggestion selection, write `suggestion.description` to `location`. No parsing or splitting required.

---

## Profile Completion Bar

A horizontal progress bar showing what percentage of the profile is filled in.

### Scoring

Each field contributes equally. Current fields (8 total, 12.5% each):

| Field | Considered complete when |
|---|---|
| `displayName` | Non-empty string |
| `username` | Non-empty string (almost always set at signup) |
| `email` | Non-empty string (always set at signup) |
| `bio` | Non-empty string |
| `location` | Non-empty string |
| `photoURL` | Non-empty string |
| `favouriteActivities` | Array with ≥ 1 item |
| `emergencyContacts` | Array with ≥ 1 item |

### Extensibility

The completion logic lives in a standalone pure function `calculateProfileCompletion(user: User): number` in `app/lib/profileCompletion.ts`. Adding future fields means adding entries to a typed config array in that file — no changes needed elsewhere.

```ts
// Conceptual shape
type CompletionField = {
  key: string
  isFilled: (user: User) => boolean
}
```

Display the bar as: `X% complete` label + a `<Progress>` component (already in `app/components/ui/progress.tsx`).

---

## UI / UX

### Layout

```
┌─────────────────────────────────────────┐
│  [Avatar]  John Smith          [Edit]   │
│            @username                    │
│                                         │
│  Profile completion  ████████░░░  75%   │
├─────────────────────────────────────────┤
│  Personal Info                          │
│  Display name  John Smith               │
│  Username      @jsmith  (locked)        │
│  Email         j@example.com  (locked)  │
│  Bio           Avid hiker and...        │
│  Location      Vancouver, BC, Canada    │
├─────────────────────────────────────────┤
│  Favourite Activities                   │
│  [Hiking] [Trail Running] [Bouldering]  │
├─────────────────────────────────────────┤
│  Emergency Contacts                     │
│  Jane Smith  jane@email.com  555-0100   │
│  [+ Add contact]                        │
└─────────────────────────────────────────┘
```

- Single Edit button in the top-right toggles the entire page into edit mode, revealing Save and Cancel actions in the same position.
- All editable fields become inputs simultaneously when in edit mode.
- Profile image is editable via click/tap on the avatar (in edit mode only).
- Username and email show a lock icon and tooltip explaining why they are not editable.

### Profile Image Upload

Firebase Storage (already available via Firebase config). Upload on file select, show preview immediately, write URL to `photoURL` on save. Accepted types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5 MB (client-side validation).

---

## Persistence

Use existing `useUpdateUser(userId)` from `app/services/users.ts`. It already handles optimistic updates and rollback on error.

Fields written on save: `displayName`, `bio`, `location`, `photoURL`, `favouriteActivities`, `emergencyContacts`.

---

## Tests

Set up **Vitest** (compatible with the existing Vite config) as the project has no test runner yet.

### Test file: `app/lib/profileCompletion.test.ts`

Cover:

- Returns 25% (2/8) for a user with only `username` and `email` set (the baseline for any new account)
- Returns `100` for a fully completed profile
- Each individual field being filled increments the score by 12.5% (1/8)
- `favouriteActivities: []` (empty array) does not count as complete
- `favouriteActivities: ['hiking']` (one item) counts as complete
- `emergencyContacts: []` (empty array) does not count as complete
- `emergencyContacts` with one full entry counts as complete
- Partial completion (e.g. 4 of 8 fields) returns 50%
- Adding a new field to the config (extensibility check) correctly changes the denominator

### Test file: `app/routes/profile.test.tsx`

Component tests using **React Testing Library**. Mock `useUpdateUser` to capture calls without hitting Firestore.

**Save:**
- Entering new values and clicking Save calls `useUpdateUser` with the updated fields
- The updated values are visible in view mode after saving

**Cancel:**
- Entering new values and clicking Cancel does not call `useUpdateUser`
- The original values are still shown in view mode after cancelling

---

## Decisions

1. **Username** — read-only permanently, no plans to make it editable.
2. **Profile image** — replace only, no remove/reset option.
3. **Display name sync** — on save, update Firebase Auth via `updateProfile(auth.currentUser, { displayName })` in addition to writing to Firestore.
4. **Firebase Storage** — assumed configured; verify the Storage bucket is initialised in the Firebase console before implementing image upload.
