# Split trip.tags into shared Trip Tags and per-member Personal Tags

`trip.tags` stores only shared trip facts: activities, accommodations, and camp kitchen style. These describe the trip for all members and are visible on the Trip Card and sidebar. Other Considerations (Baby, Kids, Pets, Photography, transport modes) and custom Gear Closet tags are stored per-member in `tripMembers[uid].personalTags` instead.

The alternative was keeping all tag categories in `trip.tags`. We rejected it because Other Considerations are personal circumstances, not trip facts — one member bringing a baby or doing photography is not a shared property of the trip, and surfacing those tags to all members on the Trip Card and in future "Add from Gear Closet" pre-selections is misleading. Custom Gear Closet tags have the same problem: they're personal inventory labels, not trip descriptors.

## Consequences

- `useGeneratePackingList` must not write Other Considerations or custom tag names back to `trip.tags` (previously a bug: all selected tags were merged into `trip.tags`).
- `TripDetailsSidebar` Other Considerations and Custom Tags sections read from `tripMembers[uid].personalTags` instead of `trip.tags`.
- `TagsStep` in new trip creation uses two form fields: `tags` (shared) and `personalTags` (personal). Both are written in the creation mutation; both increment `tagCounts`.
- Post-acceptance navigation uses `?add-gear=open` to auto-open "Add from Gear Closet" so the invited member can review the trip's shared tags and add their own Personal Tags.
