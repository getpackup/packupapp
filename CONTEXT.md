# Packup

A collaborative trip packing app where users plan gear lists together, assign items to people, and track what needs to be bought before a trip.

## Language

### Trips

**Trip**:
A planned or past outdoor adventure with a start date, end date, packing list, and Trip Members. Has no formal lifecycle state — past/upcoming/current are derived from dates in the UI, not stored.
_Avoid_: Event, adventure, outing

**Archived Trip**:
A Trip with `archived: true` — hidden from the UI entirely. "Delete Trip" in the UI sets this flag; trips are never hard-deleted.
_Avoid_: Deleted trip, removed trip

### Trips & Members

**Trip Member**:
A registered user who belongs to a Trip and can view and edit its packing list.
_Avoid_: Party member, participant, crew (crew is copy-only)

**Group Item**:
A packing list item marked `isShared: true` — visible to all Trip Members, shown in a shared container at the top of the packing list.
_Avoid_: Shared item, community gear

**Personal Item**:
A packing list item belonging to a specific Trip Member — not visible in other members' personal lists.
_Avoid_: Private item, individual item

**Shopping List**:
A cross-trip consolidated view of packing list items that need to be purchased, grouped by Trip. Items can include store, price, and quantity. Supports active use while shopping (checking off items).
_Avoid_: Buy list, purchase list, pre-trip list

**Gear Closet**:
A personal inventory of gear a user owns, seeded from a default list and fully customizable. Scoped to a single user, not a trip.
_Avoid_: Gear library, gear templates, inventory

### Users & Identity

**Anonymous User**:
A Firebase Auth user created via `signInAnonymously()` — has a real UID and Firestore data, but no email or persistent identity across devices.
_Avoid_: Guest, visitor, unauthenticated user

**Session**:
The data associated with an Anonymous User's current usage — exists in Firebase but is not recoverable from a different device.
_Avoid_: Anonymous session, guest session (use only when referring to data persistence, not identity)

**Account Gate**:
A UI pattern that blocks Anonymous Users from accessing a feature, prompting them to create an account. Distinct from a future Plan Gate (free → paid). Currently implemented as `UpgradeAccountGate` in code.
_Avoid_: Upgrade gate (implies paid tier), login wall

**Plan Gate** _(planned)_:
A UI pattern that blocks registered free users from paid-plan features. Not yet implemented.
_Avoid_: Paywall (too blunt), premium gate

**Trip Settings**:
A modal accessible from the trip sidebar that consolidates per-trip actions: Delete Trip (owner only), Leave Trip (non-owner members), and the per-member Safety Itinerary opt-out toggle. Distinct from the inline detail-editing controls already in the sidebar.
_Avoid_: Trip options, trip menu, trip preferences

**Leave Trip**:
The act of a non-owner Trip Member voluntarily removing themselves from a Trip. Sets their status to `Left`. Distinct from `Removed` (owner-initiated) and `Declined` (never accepted). A member who Left is shown in the Safety Itinerary member list for SAR accuracy.
_Avoid_: Exit trip, quit trip, remove yourself

**Assign**:
The act of designating a packing list item to a Trip Member — used when someone else (e.g. a trip organizer) allocates responsibility.
_Avoid_: Delegate, allocate

**Claim**:
The act of a Trip Member self-selecting a packing list item — used when a member adds themselves to an item.
_Avoid_: Take, grab, pick

## Relationships

- A **Trip** has one or more **Trip Members** (requires a registered account)
- A **Trip** contains many **Packing List Items**, each of which is either a **Group Item** or a **Personal Item**
- A **Packing List Item** can be **Assigned** to one or more **Trip Members**, or **Claimed** by a member themselves
- A **Packing List Item** can be sent to the **Shopping List** from within a Trip
- The **Shopping List** aggregates items across all Trips, grouped by Trip
- A **Gear Closet** belongs to exactly one registered user, independent of any Trip
- An **Anonymous User** has a real Firestore identity but cannot access their data from another device and cannot have Trip Members
- An **Archived Trip** is excluded from all UI views including the Shopping List
- A **Safety Itinerary** is sent to each Trip Member with status Owner, Accepted, or Pending — each recipient's copy includes their own **Emergency Contacts**
- Each Trip Member controls their own Safety Itinerary opt-out per trip; a global opt-out in Settings applies across all trips
- An **Emergency Contact** belongs to exactly one registered User and is not trip-specific
- A Trip Member who **Leaves** a Trip gets status `Left` — distinct from `Removed` (owner-initiated) and `Declined` (never accepted)
- **Trip Settings** is accessible from the trip sidebar and groups per-trip actions: Delete Trip, Leave Trip, and the Safety Itinerary opt-out toggle

### Safety & Notifications

**Safety Itinerary**:
A pre-trip summary email sent automatically to Trip Members with status Owner, Accepted, or Pending the day before a Trip's start date (noon UTC). Contains trip details (name, location, dates, all Trip Members with statuses Owner/Accepted/Pending/Declined) and the recipient's own Emergency Contacts. Static placeholder prompts for local SAR and police numbers are included to prompt the recipient to fill them in before sharing. Trip details are identical for all recipients; Emergency Contacts are personalized per recipient. Intended to be forwarded, printed, or shared before heading out — each person's copy in their vehicle gives Search and Rescue multiple access points to the same information. Available to all registered users; not available to Anonymous Users. Each member controls their own opt-out per trip; a global opt-out in Settings overrides all trips.
_Avoid_: Itinerary email, safety email, alert

**Emergency Contact**:
A person stored on a User's profile — not trip-specific. Fields: name (required), phoneNumber (required), email (optional). Maximum 3 per user. Included in the recipient's Safety Itinerary so they can share their whereabouts with trusted contacts. Managed in Settings.
_Avoid_: Contact, emergency person

## Example dialogue

> **Dev:** "Can an Anonymous User see Group Items on a trip?"
> **Domain expert:** "Yes — they can view and edit the packing list. They just can't invite Trip Members or Claim items on behalf of others, because those features are behind an Account Gate."

> **Dev:** "If I archive a trip, do its Shopping List items disappear?"
> **Domain expert:** "Yes — Archived Trips are hidden from the UI entirely, so their Shopping List items should not surface either."

> **Dev:** "Is 'deleting' a trip reversible?"
> **Domain expert:** "Yes — Delete sets `archived: true`. Nothing is hard-deleted. But the UI has no way to unarchive yet."

## Example dialogue

> **Dev:** "If a Pending member opts out of the Safety Itinerary, do they still appear in other members' emails?"
> **Domain expert:** "Yes — they're listed in all emails for SAR headcount purposes. Their opt-out only controls whether they personally receive the email."

> **Dev:** "Can an Owner leave a trip?"
> **Domain expert:** "No — Leave Trip is only available to non-owner members. The owner can only delete the trip."

> **Dev:** "If someone leaves a trip after the Safety Itinerary was already sent, does anything happen?"
> **Domain expert:** "No — the email is a point-in-time snapshot sent the day before. Status changes after that don't affect it."

## Flagged ambiguities

- **"Guest"** was the prior term for Anonymous User — renamed. Do not use.
- **"Session"** refers to data persistence only, not identity. Do not use it to mean Anonymous User.
- **"Delete Trip"** in the UI performs a soft-archive (`archived: true`), not a hard delete. No hard deletes exist.
- **"Upgrade"** in the current `UpgradeAccountGate` component name implies a paid tier — the domain term is Account Gate. Rename the component to `AccountGate` when `PlanGate` is introduced.
- **"Upcoming trips"** is a UI grouping derived from dates, not a stored trip state.
