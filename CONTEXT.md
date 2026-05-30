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

**Add from Gear Closet**:
The action of batch-adding packing list items by selecting tags that filter against the user's Gear Closet. Items tagged with multiple selected tags are deduplicated. Repeatable — can be used at any time to add more items, not just on initial setup. Pre-selects the trip's shared tags plus the member's Personal Tags on open.
_Avoid_: Generate packing list, generate gear list (implies one-shot; this is repeatable)

**Trip Tags**:
The tags stored on the Trip document (`trip.tags`) representing shared trip facts: activities (Hiking, Paddling, etc.), accommodations (Tent, Hostel, etc.), and camp kitchen style (Car Camping, Backcountry, etc.). Visible to all Trip Members on the Trip Card and in the sidebar. Do not include Other Considerations or custom Gear Closet tags — those are Personal Tags.
_Avoid_: Tags (too generic — distinguish from Personal Tags)

**Personal Tags**:
Per-Trip-Member tag selections stored in `tripMembers[uid].personalTags`. Includes Other Considerations (Baby, Kids, Pets, Photography, transport modes, etc.) and any custom Gear Closet tags the member has applied to this trip. Visible only to that member — not shown on the Trip Card or to other Trip Members. Used to pre-select and persist personal gear filters in "Add from Gear Closet" and shown in that member's Custom Tags / Other Considerations sections in the Trip Details sidebar.
_Avoid_: Private tags, user tags, my tags

**Frequent Tags**:
The tags a registered user has selected most often across their past trips, derived from a count stored on the User record (`tagCounts`). Surfaced at the top of the tag selection step during trip creation — unchecked by default — to speed up selection. The section is hidden entirely when no counts exist. Capped at a configurable maximum (default 5–6) to keep the signal useful. Both Trip Tags and Personal Tags are eligible; custom tags that have since been deleted from the Gear Closet are filtered out at display time. Counts are incremented at trip creation for both shared and personal selections.
_Avoid_: Frequently used tags, recent favorites, popular tags

### Friends & Social

**Friend**:
A registered user who has a mutual, accepted connection with another registered user. Both sides must have consented — one by sending a Friend Request, the other by accepting it.
_Avoid_: Connection, follower, contact

**Friend Request**:
A pending invitation from one registered user to another to become Friends. The recipient must Accept or Decline it; until then, no friendship exists. Distinct from a Trip Invitation.
_Avoid_: Friend invitation, connection request, follow request

**Send Friend Request**:
The act of initiating a Friend Request. Does not create a friendship until the recipient accepts.
_Avoid_: Add friend, follow, connect

**Accept / Decline**:
The two possible responses to a Friend Request. Accepting creates a mutual Friend relationship; Declining does not. A Declined Friend Request leaves no visible trace to the sender. A sender whose request was Declined may re-send after a 30-day cooldown.
_Avoid_: Approve, reject, ignore (use Decline)

**Unfriend**:
The act of removing a mutual Friend relationship. Either party can Unfriend the other at any time. The action is silent — the removed person receives no notification and simply no longer appears in each other's Friends lists.
_Avoid_: Remove friend, disconnect, block (Unfriend is not the same as blocking)

**Friend Request Notification**:
When a Friend Request is received, the recipient sees an in-app badge on the Friends nav item and receives an email notification. Email can be disabled per-user via a preference in Settings (analogous to the Safety Itinerary opt-out). In-app badge cannot be disabled.

**Trip Invitation**:
An invitation to join a specific Trip as a Trip Member. Distinct from a Friend Request — the two can be bundled together when inviting a non-Friend to a trip, but are independent: accepting one does not require accepting the other.
_Avoid_: Trip invite (in formal copy — fine in UI shorthand)

**Public Profile** _(planned)_:
A per-user page visible to others, showing name, avatar, bio, and location to anyone; past trip history visible to Friends only. Trip history is opt-out: trips appear on a user's profile by default, and each Trip Member independently controls whether to hide individual trips from their profile. Non-friends and logged-out visitors see name, avatar, bio, and location only — no trip history. Designed to support an asymmetric Follow model in the future (where anyone can follow a public profile for trip content) without requiring a redesign — "visible to Friends" is a placeholder for "visible to Followers."
_Avoid_: Profile page (too generic — the public-facing view is the Public Profile; the editing surface is Settings)

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

- A **Friend** relationship is mutual and symmetric — both users must consent; neither is "following" the other
- A **Friend Request** is directional until accepted, at which point it becomes a symmetric **Friend** relationship; a Declined request can be re-sent after 30 days
- A **Trip Invitation** and a **Friend Request** can be sent together when inviting a non-Friend to a trip, but are resolved independently
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
- Each registered User has a global **Chat Message Notification** opt-out in Settings; a per-trip mute in Trip Settings is planned for a future phase
- A registered User's **FCM Tokens** are stored on their User document and used to deliver Chat Message Notifications across all their devices; OS/browser permission is the per-device control

### Chat

**Trip Chat**:
The real-time messaging feature within a Trip, accessible to all Trip Members via a slide-over sheet. Available to registered users only (Anonymous Users see an Account Gate). Messages are stored as a subcollection under the Trip.
_Avoid_: Trip messages, trip discussion

**Chat Message**:
A single message posted in a Trip Chat by a Trip Member or the system (e.g. join/leave events). Has a type (`text`, `image`, `system`), sender, timestamp, and optional reply reference.
_Avoid_: Post, comment

**Chat Message Notification**:
A push notification sent to Trip Members when a new Chat Message is posted. Content: "[Username] sent a message in [Trip Name]". Tapping navigates to the trip with the chat sheet pre-opened (`/trips/{tripId}?chat=open`). Only sent to members who did not send the message — all of the sender's registered devices are excluded. Delivered via FCM web push (service worker) for web browsers, Android TWA, and iOS PWA (home screen). iOS App Store native push is a separate phase. Requires explicit opt-in: OS/browser permission is requested the first time a user opens a Trip Chat. A global opt-out toggle in Settings suppresses all Chat Message Notifications regardless of device. Per-trip muting _(planned)_ will live in Trip Settings.
_Avoid_: Chat alert, message alert, push alert

**Unread Chat Indicator**:
A dot badge shown on the TripCard (trips list) and on the Trip Chat button (within a trip) when the current user has unread messages in that trip's chat. Derived client-side by comparing `chatMetadata.lastMessageAt` against `userReadStatus.lastReadAt`. Cleared when the chat sheet is opened.
_Avoid_: Unread count, unread badge, notification dot

**FCM Token**:
A device-specific registration token issued by Firebase Cloud Messaging, stored as an array on the User document in Firestore. Supports multiple tokens per user (phone, tablet, browser). Refreshed on each app load. Used by Cloud Functions to deliver Chat Message Notifications to specific devices while excluding all of the sender's registered devices. Stale tokens (rejected by FCM) are pruned automatically by the Cloud Function.
_Avoid_: Push token, device token, registration ID

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
