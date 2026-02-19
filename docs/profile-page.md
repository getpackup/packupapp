# Profile Page

## Purpose

Allow users to view and edit their personal profile information. A profile completion bar encourages them to fill in all fields.

---

## Fields

| Field | Editable | Notes |
|---|---|---|
| Display name | Yes | Existing `displayName` field on `User` |
| Username | No (header only) | Shown under the display name in the page header; not repeated in Personal Info |
| Email | No (display only) | Firebase Auth–owned; shown in Personal Info with a lock icon |
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

Display as a tag list in view mode. In edit mode, show all 16 as selectable tags (toggle on/off). Selected tags are visually distinct (filled/coloured vs outlined). Empty state text (view mode): *"What are your favourite activities?"*

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
- Email shows a lock icon and tooltip explaining why it is not editable.
- Username is shown only in the header (@username), not in the Personal Info section.
- All interactive elements use `cursor: pointer`.

### Responsive Layout

Below **715 px**:
- **Personal Info** — single-column grid; label sits above its value.
- **Emergency Contacts** — each contact's fields (name / email / phone) stack vertically; remove button aligns to the end of the stack.

Above 715 px:
- **Personal Info** — two-column grid (`120px` label | `1fr` value); labels and values centre-aligned vertically (bio label pins to top to match the textarea).
- **Emergency Contacts** — fields displayed in a single row.

### Profile Image Upload

Accepted types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5 MB (client-side validation). Images are uploaded to Firebase Storage immediately on file select (not deferred to save). The resulting URL is stored in local state and written to Firestore when the user clicks Save.

#### Crop flow

1. User clicks the avatar overlay (edit mode only) → opens the file picker.
2. Validate MIME type and file size; show a `toast.error` and abort if invalid.
3. Read the image's natural dimensions.
   - **Already square** (width === height): skip the crop dialog and upload directly.
   - **Not square**: open the crop dialog.
4. **Crop dialog** (`react-easy-crop`, 1:1 aspect ratio):
   - User drags to reposition and scrolls / uses a slider (1×–3× zoom) to zoom.
   - **Crop & Upload**: canvas-extracts the selected region as a JPEG blob → uploads to `user-avatars/{uid}` in Firebase Storage → sets the download URL as the avatar preview.
   - **Cancel**: dismisses the dialog without uploading anything.
5. The avatar preview updates immediately after upload; the URL is persisted to Firestore when the user saves.

---

## Persistence

Use existing `useUpdateUser(userId)` from `app/services/users.ts`. It already handles optimistic updates and rollback on error.

Fields written on save: `displayName`, `bio`, `location`, `photoURL`, `favouriteActivities`, `emergencyContacts`.

---

## Tests

Vitest + React Testing Library. Run with `pnpm test`.

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

Mock `useUpdateUser` to capture calls without hitting Firestore. Mock `firebase/storage` to capture upload calls.

**Save:**
- Entering new values and clicking Save calls `useUpdateUser` with the updated fields
- Exits edit mode after saving

**Cancel:**
- Entering new values and clicking Cancel does not call `useUpdateUser`
- The original values are still shown in view mode after cancelling

**Image upload:**
- Invalid MIME type shows a `toast.error` and does not upload
- File over 5 MB shows a `toast.error` and does not upload
- Valid image calls `uploadBytes` on Firebase Storage
- Square image (equal dimensions) skips the crop dialog and uploads directly *(todo — requires crop implementation)*
- Non-square image shows the crop dialog before uploading *(todo — requires crop implementation)*

**Crop dialog:**
- Confirming crop uploads the canvas-extracted blob to Firebase Storage *(todo — requires crop implementation)*
- Cancelling crop discards the selection without uploading *(todo — requires crop implementation)*

**Activities:**
- Toggling an unselected activity in edit mode adds it to the saved selection
- Toggling a selected activity in edit mode removes it from the saved selection

**Emergency contacts:**
- Clicking "Add contact" adds a new empty contact row in edit mode
- Clicking the remove button deletes the contact row

---

## Decisions

1. **Username** — read-only permanently, no plans to make it editable. Shown only in the page header, not repeated in the Personal Info section.
2. **Profile image** — replace only, no remove/reset option.
3. **Display name sync** — on save, update Firebase Auth via `updateProfile(auth.currentUser, { displayName })` in addition to writing to Firestore.
4. **Firebase Storage** — assumed configured; verify the Storage bucket is initialised in the Firebase console before implementing image upload.
5. **Image upload timing** — upload to Firebase Storage on file select (or crop confirm), not on save. Only the Firestore write is deferred to save.
6. **Crop library** — `react-easy-crop` for the interactive crop UI. Canvas API used to extract the cropped region as a JPEG blob before uploading.
7. **Crop skipped for square images** — if natural width equals natural height, the crop dialog is bypassed entirely.
