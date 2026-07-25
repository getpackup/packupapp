# "Add from Gear Closet" dedupes per-member against Personal Items only

`useGeneratePackingList` built its dedup set (`existingGearItemIds`) from every packing-list doc on the trip, regardless of which Trip Member owned it. This meant a second invited member selecting the trip's pre-selected tags (e.g. after accepting an invite and landing on `?add-gear=open`) would get nothing for any tag whose gear another member had already generated — the matching master/custom items were filtered out because they already existed *somewhere* on the trip, even though the new member had zero Personal Items of their own.

We scoped the dedup set to the acting member's own Personal Items: a gear item is excluded only if the acting `userId` already has a `packedBy` entry for it with `isShared: false`. Group Items (`isShared: true`) the acting member is Assigned to or has Claimed are ignored for dedup purposes entirely, even though they represent the same `gearItemId`.

The alternative was to fold the acting member into an existing Group Item's `packedBy` instead of generating a new Personal Item, treating "already exists on the trip" as "already covered." We rejected it because gear needs aren't always 1:1 shareable per trip — e.g. a group may need two tents, not one — and because Group Item assignment happens via an explicit, separate action (the "Assign to" control on an item), not implicitly through tag-based generation. Generation's job is to fill in the acting member's own Personal Items; it should never reach across members or silently merge them into shared state.

## Consequences

- `useGeneratePackingList` (`app/services/trips.ts`) filters `existingSnap.docs` to those where `packedBy.some(p => p.uid === userId && p.isShared === false)` before collecting `gearItemId`s into `existingGearItemIds`, instead of using every doc on the trip.
- `assemblePackingListItems` / `filterGearByActivities` are unchanged — they only consume whatever `existingGearItemIds` set they're given.
- Repeat submissions by the same member still dedupe correctly (their own prior Personal Items count).
- A member already Assigned to or who Claimed a Group Item for a given `gearItemId` will still get their own Personal Item for it if they select a matching tag — this is intentional, not a bug.
- No backfill: members already affected by the old trip-wide dedup self-heal by reopening "Add from Gear Closet" and resubmitting.
